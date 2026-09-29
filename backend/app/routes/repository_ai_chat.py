import asyncio
import json
import os
import re
from pathlib import PurePosixPath

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.repository_file import RepositoryFile
from app.models.repository_index import RepositoryIndex
from app.routes.auth import get_current_user
from app.routes.repository_indexing import (
    get_github_file_content,
    get_repository_access_for_index,
)


router = APIRouter(tags=["AI Chat"])

MAX_MESSAGE_CHARS = 4000
MAX_HISTORY_MESSAGES = 8
MAX_CONTEXT_FILES = 7
MAX_FILE_CONTEXT_CHARS = 18000
MAX_TOTAL_CONTEXT_CHARS = 70000

AI_TIMEOUT_SECONDS = 90.0
AI_MAX_OUTPUT_TOKENS = 1800
AI_TEMPERATURE = 0.15

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-3.8-flash:generateContent"
)


class AIChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=8000)


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: list[AIChatMessage] = Field(
        default_factory=list,
        max_length=MAX_HISTORY_MESSAGES,
    )


def tokenize(value: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-zA-Z0-9_]+", value.lower())
        if len(token) >= 2
    ]


def is_readme(path: str) -> bool:
    return PurePosixPath(path).name.lower() in {
        "readme",
        "readme.md",
        "readme.mdx",
        "readme.txt",
    }


def is_manifest(path: str) -> bool:
    return PurePosixPath(path).name.lower() in {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "go.mod",
        "composer.json",
    }


def choose_relevant_files(
    files: list[RepositoryFile],
    question: str,
) -> list[RepositoryFile]:
    question_tokens = set(tokenize(question))
    synonym_groups = {
        "auth": {
            "auth",
            "authentication",
            "authorize",
            "authorization",
            "login",
            "logout",
            "session",
            "token",
            "jwt",
            "oauth",
            "permission",
            "middleware",
        },
        "database": {
            "database",
            "db",
            "sql",
            "postgres",
            "postgresql",
            "mysql",
            "mongo",
            "mongodb",
            "query",
            "model",
            "schema",
        },
        "api": {
            "api",
            "endpoint",
            "route",
            "routes",
            "request",
            "response",
            "controller",
            "service",
            "http",
            "fetch",
            "axios",
        },
        "frontend": {
            "ui",
            "frontend",
            "component",
            "components",
            "page",
            "pages",
            "react",
            "hook",
            "hooks",
            "state",
            "render",
        },
        "deployment": {
            "deploy",
            "deployment",
            "docker",
            "dockerfile",
            "vercel",
            "nginx",
            "production",
            "build",
        },
        "ai": {
            "ai",
            "gemini",
            "openai",
            "groq",
            "llm",
            "embedding",
            "embeddings",
            "vector",
            "rag",
            "model",
        },
    }

    expanded_terms = set(question_tokens)
    for group in synonym_groups.values():
        if question_tokens.intersection(group):
            expanded_terms.update(group)

    scored = []
    for index, file in enumerate(files):
        path_lower = file.path.lower()
        filename_lower = (file.filename or "").lower()
        language_lower = (file.language or "").lower()
        score = 0

        if is_readme(file.path):
            score += 45
        if is_manifest(file.path):
            score += 18
        if file.category == "code":
            score += 4

        for term in expanded_terms:
            if term in filename_lower:
                score += 18
            if term in path_lower:
                score += 9
            if term in language_lower:
                score += 3

        score += max(0, 8 - file.path.count("/"))
        scored.append((score, -index, file))

    scored.sort(
        key=lambda item: (item[0], item[1]),
        reverse=True,
    )
    return [item[2] for item in scored[:MAX_CONTEXT_FILES]]


def trim_context(
    sources: list[tuple[RepositoryFile, str]],
) -> list[tuple[RepositoryFile, str]]:
    total = 0
    result = []

    for file, content in sources:
        remaining = MAX_TOTAL_CONTEXT_CHARS - total
        if remaining <= 0:
            break

        content = content[: min(MAX_FILE_CONTEXT_CHARS, remaining)]
        if content.strip():
            result.append((file, content))
            total += len(content)

    return result


async def fetch_source_contents(
    token: str,
    full_name: str,
    branch: str,
    files: list[RepositoryFile],
):
    async def fetch_one(file):
        content = await asyncio.to_thread(
            get_github_file_content,
            token,
            full_name,
            file.path,
            branch,
        )
        return file, content

    results = await asyncio.gather(
        *(fetch_one(file) for file in files),
        return_exceptions=True,
    )

    sources = []
    for result in results:
        if isinstance(result, Exception):
            continue

        file, content = result
        if content and content.strip():
            sources.append((file, content))

    return trim_context(sources)


def source_block(sources: list[tuple[RepositoryFile, str]]) -> str:
    return "\n\n".join(
        f"FILE: {file.path}\n"
        f"LANGUAGE: {file.language or 'unknown'}\n"
        f"SOURCE:\n```\n{content}\n```"
        for file, content in sources
    )


def clean_json(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )
        text = re.sub(r"\s*```$", "", text)

    # Some OpenAI-compatible models occasionally add a short sentence
    # around otherwise valid JSON. Pull out the outermost JSON object.
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]

    return text.strip()


def parse_openai_compatible_json(data: dict) -> dict:
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise ValueError("Invalid OpenAI-compatible provider response") from error

    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                text_parts.append(part["text"])
        content = "".join(text_parts)

    if not isinstance(content, str) or not content.strip():
        raise ValueError("Provider returned an empty response")

    return json.loads(clean_json(content))


def provider_headers(name: str, api_key: str) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    return headers


async def call_openai_compatible(
    *,
    name: str,
    api_key: str,
    api_url: str,
    model: str,
    prompt: str,
) -> dict:
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": AI_TEMPERATURE,
        "max_tokens": AI_MAX_OUTPUT_TOKENS,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
        response = await client.post(
            api_url,
            headers=provider_headers(name, api_key),
            json=body,
        )

    if response.status_code != 200:
        try:
            error_data = response.json()
        except ValueError:
            error_data = {}

        message = (
            error_data.get("error", {}).get("message")
            if isinstance(error_data, dict)
            else None
        ) or f"{name} returned HTTP {response.status_code}."

        raise ProviderError(
            provider=name,
            model=model,
            status_code=response.status_code,
            message=message,
        )

    try:
        return parse_openai_compatible_json(response.json())
    except (ValueError, json.JSONDecodeError) as error:
        raise ProviderError(
            provider=name,
            model=model,
            status_code=502,
            message=f"{name} returned an invalid JSON response.",
        ) from error


async def call_gemini(
    api_key: str,
    prompt: str,
) -> dict:
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": AI_TEMPERATURE,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
        response = await client.post(
            GEMINI_API_URL,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            json=body,
        )

    if response.status_code != 200:
        try:
            error_data = response.json()
        except ValueError:
            error_data = {}

        message = (
            error_data.get("error", {}).get("message")
            if isinstance(error_data, dict)
            else None
        ) or f"Gemini returned HTTP {response.status_code}."

        raise ProviderError(
            provider="gemini",
            model="gemini-3.8-flash",
            status_code=response.status_code,
            message=message,
        )

    try:
        data = response.json()
        generated = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(clean_json(generated))
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise ProviderError(
            provider="gemini",
            model="gemini-3.8-flash",
            status_code=502,
            message="Gemini returned an invalid JSON response.",
        ) from error


class ProviderError(Exception):
    def __init__(
        self,
        *,
        provider: str,
        model: str,
        status_code: int,
        message: str,
    ):
        self.provider = provider
        self.model = model
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def provider_is_configured(name: str) -> bool:
    if name == "groq":
        return bool(os.getenv("GROQ_API_KEY"))
    if name == "gemini":
        return bool(os.getenv("GEMINI_API_KEY"))
    return False


async def call_ai(prompt: str) -> tuple[dict, str, str]:
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    attempts = []

    providers = [
        (
            "groq",
            groq_key,
            lambda: call_openai_compatible(
                name="groq",
                api_key=groq_key,
                api_url=GROQ_API_URL,
                model=groq_model,
                prompt=prompt,
            ),
            groq_model,
        ),
        (
            "gemini",
            gemini_key,
            lambda: call_gemini(gemini_key, prompt),
            "gemini-3.8-flash",
        ),
    ]

    for name, api_key, call, model in providers:
        if not api_key:
            attempts.append(f"{name}: not configured")
            continue

        try:
            result = await call()
            return result, name, model
        except ProviderError as error:
            attempts.append(
                f"{error.provider}: HTTP {error.status_code} - {error.message}"
            )
            # Never immediately repeat a provider that just returned a
            # rate-limit/quota response. Move to the next provider.
            continue
        except httpx.TimeoutException:
            attempts.append(f"{name}: request timed out")
            continue
        except httpx.HTTPError as error:
            attempts.append(f"{name}: connection error - {error}")
            continue
        except Exception as error:
            # Do not let one provider failure prevent fallback providers.
            attempts.append(f"{name}: unexpected error - {error}")
            continue

    configured = [name for name, key, _, _ in providers if key]

    if not configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "No AI provider is configured. Add GROQ_API_KEY or "
                "GEMINI_API_KEY to the backend .env file."
            ),
        )

    all_rate_limited = all(
        ("HTTP 429" in attempt) or ("HTTP 503" in attempt)
        for attempt in attempts
        if ": HTTP" in attempt
    )

    summary = "; ".join(attempts)

    if all_rate_limited:
        raise HTTPException(
            status_code=429,
            detail=(
                "All configured AI providers are temporarily rate limited. "
                f"Provider status: {summary}"
            ),
            headers={"Retry-After": "30"},
        )

    raise HTTPException(
        status_code=503,
        detail=(
            "GitLoop could not get a response from the configured AI providers. "
            f"Provider status: {summary}"
        ),
    )


async def get_repository_context(
    repository_id: int,
    user_id: int,
    db: Session,
):
    repository_index = (
        db.query(RepositoryIndex)
        .filter(
            RepositoryIndex.user_id == user_id,
            RepositoryIndex.github_repository_id == repository_id,
        )
        .first()
    )

    if repository_index is None:
        raise HTTPException(
            status_code=404,
            detail="Repository has not been indexed yet.",
        )

    if repository_index.status not in {"COMPLETED", "PARTIAL"}:
        raise HTTPException(
            status_code=409,
            detail="Repository indexing is not complete.",
        )

    files = (
        db.query(RepositoryFile)
        .filter(RepositoryFile.repository_index_id == repository_index.id)
        .all()
    )

    if not files:
        raise HTTPException(
            status_code=409,
            detail="No indexed repository files are available for AI chat.",
        )

    _repository, token, _source = await get_repository_access_for_index(
        repository_index,
        user_id,
        db,
    )

    return repository_index, files, token


@router.get("/repositories/{repository_id}/ai-chat/overview")
async def get_ai_chat_overview(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repository_index = (
        db.query(RepositoryIndex)
        .filter(
            RepositoryIndex.user_id == current_user["id"],
            RepositoryIndex.github_repository_id == repository_id,
        )
        .first()
    )

    if repository_index is None:
        raise HTTPException(
            status_code=404,
            detail="Repository has not been indexed yet.",
        )

    if repository_index.status not in {"COMPLETED", "PARTIAL"}:
        raise HTTPException(
            status_code=409,
            detail="Repository indexing is not complete.",
        )

    # Opening AI Chat does not consume any model quota.
    return {
        "repository_id": repository_id,
        "overview": "",
    }


@router.post("/repositories/{repository_id}/ai-chat")
async def ai_chat(
    repository_id: int,
    payload: AIChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repository_index, files, token = await get_repository_context(
        repository_id,
        current_user["id"],
        db,
    )

    relevant_files = choose_relevant_files(files, payload.message)
    sources = await fetch_source_contents(
        token,
        repository_index.full_name,
        repository_index.branch or "main",
        relevant_files,
    )

    if not sources:
        raise HTTPException(
            status_code=502,
            detail=(
                "GitLoop could not retrieve readable source files "
                "from the repository."
            ),
        )

    history_text = (
        "\n".join(
            f"{item.role.upper()}: {item.content}"
            for item in payload.history[-MAX_HISTORY_MESSAGES:]
        )
        or "No previous conversation."
    )

    prompt = f"""
You are GitLoop, a repository-aware coding assistant.

Answer the user's question using ONLY the repository context and exact source files below.

Rules:
- Do not invent files, functions, dependencies, APIs, architecture, or behavior.
- Prefer the repository source over general knowledge.
- If the available source is insufficient, say: "I couldn't determine that from the available repository code."
- Explain code in practical developer-friendly language.
- For implementation questions, name the relevant file(s).
- Keep the answer focused.
- Cite repository files through the sources array.
- Return valid JSON only. Do not use markdown fences around the JSON.

Return exactly:
{{
  "answer": "Normal human-language answer",
  "sources": [
    {{"path":"exact/path/to/file.ext","reason":"Why this file is relevant"}}
  ]
}}

CONVERSATION:
{history_text}

CURRENT QUESTION:
{payload.message}

REPOSITORY:
{repository_index.full_name}
BRANCH:
{repository_index.branch or 'main'}

SELECTED SOURCE FILES:
{source_block(sources)}
""".strip()

    result, provider, model = await call_ai(prompt)

    answer = result.get("answer")
    if not isinstance(answer, str) or not answer.strip():
        raise HTTPException(
            status_code=502,
            detail=(
                f"{provider} returned an empty chat answer."
            ),
        )

    valid_paths = {file.path for file, _ in sources}
    clean_sources = []

    for source in result.get("sources") or []:
        if not isinstance(source, dict):
            continue

        path = source.get("path")
        if path not in valid_paths:
            continue

        reason = source.get("reason")
        clean_sources.append(
            {
                "path": path,
                "reason": (
                    reason.strip()
                    if isinstance(reason, str) and reason.strip()
                    else "Relevant repository source."
                ),
            }
        )

    return {
        "repository_id": repository_id,
        "answer": answer.strip(),
        "sources": clean_sources[:6],
        "provider": provider,
        "model": model,
    }
