import asyncio
import json
import os
import random
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.routes.auth import get_current_user


router = APIRouter(
    tags=["File Intelligence"],
)


GEMINI_API_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)

# Primary + reliable lightweight fallback.
GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
]

MAX_ANALYSIS_CHARS = 600_000

MAX_RETRIES_PER_MODEL = 3


class FileIntelligenceRequest(BaseModel):
    path: str = Field(
        min_length=1,
        max_length=1000,
    )

    filename: str = Field(
        min_length=1,
        max_length=255,
    )

    language: str | None = Field(
        default=None,
        max_length=100,
    )

    content: str = Field(
        min_length=1,
        max_length=MAX_ANALYSIS_CHARS,
    )


def clean_json_text(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\s*```$",
            "",
            text,
        )

    return text.strip()


def extract_analysis(response_data: dict) -> dict:
    generated_text = (
        response_data["candidates"][0]
        ["content"]["parts"][0]["text"]
    )

    cleaned_text = clean_json_text(
        generated_text
    )

    analysis = json.loads(cleaned_text)

    required_fields = (
        "what_is_this_file",
        "why_is_this_file_used",
        "how_does_this_file_work",
    )

    for field in required_fields:
        value = analysis.get(field)

        if not isinstance(value, str):
            raise ValueError(
                f"Invalid analysis field: {field}"
            )

        if not value.strip():
            raise ValueError(
                f"Empty analysis field: {field}"
            )

    return {
        "what_is_this_file": (
            analysis["what_is_this_file"].strip()
        ),
        "why_is_this_file_used": (
            analysis["why_is_this_file_used"].strip()
        ),
        "how_does_this_file_work": (
            analysis["how_does_this_file_work"].strip()
        ),
    }


async def call_gemini(
    client: httpx.AsyncClient,
    model_name: str,
    request_body: dict,
    api_key: str,
):
    url = (
        f"{GEMINI_API_BASE_URL}/"
        f"{model_name}:generateContent"
    )

    for attempt in range(MAX_RETRIES_PER_MODEL):

        try:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
                json=request_body,
            )

        except httpx.TimeoutException:
            if attempt == MAX_RETRIES_PER_MODEL - 1:
                return None, "timeout"

        except httpx.HTTPError as error:
            if attempt == MAX_RETRIES_PER_MODEL - 1:
                return None, str(error)

        else:
            if response.status_code == 200:
                return response, None

            if response.status_code in (
                429,
                500,
                503,
            ):
                try:
                    error_data = response.json()

                    error_message = (
                        error_data
                        .get("error", {})
                        .get("message")
                    )
                except ValueError:
                    error_message = None

                if attempt == MAX_RETRIES_PER_MODEL - 1:
                    return (
                        None,
                        error_message
                        or f"Gemini returned {response.status_code}",
                    )

            else:
                try:
                    error_data = response.json()

                    error_message = (
                        error_data
                        .get("error", {})
                        .get("message")
                    )
                except ValueError:
                    error_message = None

                raise HTTPException(
                    status_code=502,
                    detail=(
                        error_message
                        or (
                            "Gemini returned an "
                            f"unexpected HTTP {response.status_code} error."
                        )
                    ),
                )

        # Exponential backoff + small jitter.
        delay = (2 ** attempt) + random.uniform(
            0.2,
            0.8,
        )

        await asyncio.sleep(delay)

    return None, "Gemini request failed"


@router.post(
    "/repositories/{repository_id}/file-intelligence"
)
async def analyze_file_intelligence(
    repository_id: int,
    payload: FileIntelligenceRequest,
    current_user: dict = Depends(get_current_user),
):
    # Require authentication.
    _ = current_user["id"]

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "GEMINI_API_KEY is not configured "
                "in the backend environment."
            ),
        )

    language = payload.language or "not detected"

    prompt = f"""
You are GitLoop's file-level code intelligence engine.

Analyze ONLY the exact source code supplied below.

Do not use repository-wide assumptions.

File path:
{payload.path}

File name:
{payload.filename}

Detected language:
{language}

Rules:

1. Analyze only the supplied source code.
2. Do not invent functionality.
3. Do not invent dependencies.
4. Do not invent APIs.
5. Do not infer behavior only from the filename.
6. Base explanations on actual code.
7. Use imports, exports, functions, components,
   variables, state, control flow, API calls,
   configuration and comments when they exist.
8. If something cannot be determined from this file alone,
   say exactly:
   "Not determinable from this file alone."
9. Return valid JSON only.
10. Do not use Markdown code fences.

Return exactly:

{{
  "what_is_this_file":
    "Explain exactly what this file is and what it contains.",

  "why_is_this_file_used":
    "Explain why this file exists and what role it performs based only on its actual code.",

  "how_does_this_file_work":
    "Explain the actual execution flow and important logic inside this file."
}}

Source code:

---BEGIN FILE---

{payload.content}

---END FILE---
""".strip()

    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(
        timeout=90.0
    ) as client:

        errors = []

        for model_name in GEMINI_MODELS:

            print(
                f"[GitLoop AI] Trying {model_name}"
            )

            response, error = await call_gemini(
                client=client,
                model_name=model_name,
                request_body=request_body,
                api_key=api_key,
            )

            if response is None:

                print(
                    f"[GitLoop AI] {model_name} failed: "
                    f"{error}"
                )

                errors.append(
                    f"{model_name}: {error}"
                )

                continue

            try:
                provider_data = response.json()

                analysis = extract_analysis(
                    provider_data
                )

            except (
                KeyError,
                IndexError,
                TypeError,
                ValueError,
                json.JSONDecodeError,
            ) as error:

                print(
                    f"[GitLoop AI] Invalid response "
                    f"from {model_name}: {error}"
                )

                errors.append(
                    f"{model_name}: invalid response"
                )

                continue

            print(
                f"[GitLoop AI] Success using "
                f"{model_name}"
            )

            return {
                "repository_id": repository_id,
                "path": payload.path,
                "analysis": analysis,
                "model": model_name,
            }

    raise HTTPException(
        status_code=503,
        detail=(
            "Gemini is temporarily unavailable. "
            "GitLoop retried the analysis and also "
            "attempted a fallback model. Please try "
            "again in a moment."
        ),
        headers={
            "Retry-After": "10",
        },
    )