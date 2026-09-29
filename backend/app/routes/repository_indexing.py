from datetime import datetime
import base64
import json
import re
from pathlib import PurePosixPath
from urllib.parse import quote, urlparse

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.github_installation import GitHubInstallation
from app.models.repository_file import RepositoryFile
from app.models.repository_index import RepositoryIndex
from app.routes.auth import get_current_user
from app.services.github_app_service import create_installation_access_token


router = APIRouter(
    tags=["Repository Indexing"],
)


GITHUB_API = "https://api.github.com"
GITHUB_API_VERSION = "2026-03-10"

MAX_FILES = 5000
MAX_FILE_SIZE = 2_000_000


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build",
    ".next",
    "coverage",
    ".idea",
    ".vscode",
}


IGNORED_FILES = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
}


LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++",
    ".hpp": "C++",
    ".go": "Go",
    ".rs": "Rust",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".json": "JSON",
    ".xml": "XML",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".mdx": "Markdown",
}


CONFIG_FILES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "vite.config.js",
    "vite.config.jsx",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
}


def get_file_information(path: str):
    path_obj = PurePosixPath(path)

    filename = path_obj.name
    extension = path_obj.suffix.lower()

    if extension in LANGUAGE_MAP:
        language = LANGUAGE_MAP[extension]

        if extension in {".md", ".mdx"}:
            category = "documentation"
        elif extension in {".json", ".xml", ".yaml", ".yml"}:
            category = "config"
        else:
            category = "code"

        return filename, extension, language, category

    if filename.lower() in CONFIG_FILES:
        return filename, extension, "Configuration", "config"

    return filename, extension, None, "other"


def should_ignore(path: str, size: int | None):
    path_obj = PurePosixPath(path)

    parts = {part.lower() for part in path_obj.parts}

    if parts.intersection(IGNORED_DIRECTORIES):
        return True

    if path_obj.name.lower() in IGNORED_FILES:
        return True

    if path_obj.suffix.lower() in {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".ico",
        ".mp4",
        ".mp3",
        ".zip",
        ".tar",
        ".gz",
        ".exe",
        ".dll",
        ".bin",
        ".pdf",
        ".pem",
        ".key",
    }:
        return True

    if size is not None and size > MAX_FILE_SIZE:
        return True

    return False


def github_headers(token: str | None = None):
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    return headers


def get_installation_repositories(token: str):
    response = requests.get(
        f"{GITHUB_API}/installation/repositories",
        headers=github_headers(token),
        params={
            "per_page": 100,
            "page": 1,
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Unable to fetch repositories from GitHub.",
        )

    data = response.json()

    return data.get("repositories", [])


def get_repository_tree(
    token: str | None,
    full_name: str,
    branch: str,
):
    encoded_branch = quote(branch, safe="")

    response = requests.get(
        f"{GITHUB_API}/repos/{full_name}/git/trees/{encoded_branch}",
        headers=github_headers(token),
        params={
            "recursive": "1",
        },
        timeout=60,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Unable to read repository files from GitHub.",
        )

    return response.json()


def github_get(url: str, token: str | None = None, params=None):
    response = requests.get(
        url,
        headers=github_headers(token),
        params=params,
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"GitHub request failed with status {response.status_code}.",
        )

    return response.json()


def get_github_file_content(token: str | None, full_name: str, path: str, branch: str):
    response = requests.get(
        f"{GITHUB_API}/repos/{full_name}/contents/{quote(path, safe='/')}",
        headers=github_headers(token),
        params={"ref": branch},
        timeout=30,
    )

    if response.status_code == 404:
        return None

    if response.status_code != 200:
        return None

    data = response.json()
    encoded = data.get("content")

    if not encoded:
        return None

    try:
        return base64.b64decode(encoded).decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        return None


def detect_stack_from_manifests(manifests):
    """
    Detect technologies only from dependency/configuration files that actually
    exist in the indexed repository.

    Each manifest entry is: {"path": str, "content": str}.
    """
    frontend = []
    backend = []
    database = []
    other = []

    npm_dependencies = set()
    python_dependencies = set()
    manifest_paths = []

    for manifest in manifests:
        path = manifest.get("path", "")
        content = manifest.get("content") or ""
        manifest_paths.append(path)

        lower_name = PurePosixPath(path).name.lower()

        if lower_name == "package.json":
            try:
                package_data = json.loads(content)
                for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
                    deps = package_data.get(key, {}) or {}
                    if isinstance(deps, dict):
                        npm_dependencies.update(str(name).lower() for name in deps.keys())
            except (json.JSONDecodeError, TypeError, AttributeError):
                pass

        elif lower_name == "requirements.txt" or lower_name.startswith("requirements-") and lower_name.endswith(".txt"):
            for raw_line in content.splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or line.startswith("-"):
                    continue
                line = re.split(r"[<>=!~;\[]", line, maxsplit=1)[0].strip().lower()
                if line:
                    python_dependencies.add(line)

        elif lower_name == "pyproject.toml":
            # TOML parsing is intentionally avoided so this works without an
            # additional dependency.  Dependency names are extracted from the
            # dependency strings in common Poetry/PEP 621 sections.
            for match in re.finditer(r"[\"']([A-Za-z0-9_.-]+)(?:\s*[<>=!~].*)?[\"']", content):
                candidate = match.group(1).strip().lower()
                if candidate:
                    python_dependencies.add(candidate)

    def has_npm(*names):
        wanted = {name.lower() for name in names}
        return bool(wanted.intersection(npm_dependencies))

    def has_python(*names):
        wanted = {name.lower() for name in names}
        return bool(wanted.intersection(python_dependencies))

    def add_unique(target, value):
        if value not in target:
            target.append(value)

    frontend_rules = [
        (("react", "react-dom"), "React"),
        (("next",), "Next.js"),
        (("@angular/core",), "Angular"),
        (("vue",), "Vue"),
        (("svelte",), "Svelte"),
        (("vite",), "Vite"),
        (("tailwindcss",), "Tailwind CSS"),
        (("bootstrap",), "Bootstrap"),
    ]

    for names, label in frontend_rules:
        if has_npm(*names):
            add_unique(frontend, label)

    backend_rules = [
        (("express",), ("",), "Express"),
        (("@nestjs/core",), ("",), "NestJS"),
        (("",), ("fastapi",), "FastAPI"),
        (("",), ("flask",), "Flask"),
        (("",), ("django",), "Django"),
        (("",), ("django-rest-framework", "djangorestframework"), "Django REST Framework"),
        (("",), ("uvicorn",), "Uvicorn"),
        (("",), ("gunicorn",), "Gunicorn"),
    ]

    for npm_names, python_names, label in backend_rules:
        if (npm_names[0] and has_npm(*npm_names)) or (python_names[0] and has_python(*python_names)):
            add_unique(backend, label)

    database_rules = [
        (("pg", "postgres", "postgresql", "@prisma/client", "drizzle-orm"), ("sqlalchemy", "psycopg2", "psycopg2-binary", "asyncpg", "psycopg"), "PostgreSQL"),
        (("mysql", "mysql2", "@planetscale/database"), ("mysqlclient", "pymysql", "mysql-connector-python"), "MySQL"),
        (("mongoose", "mongodb", "mongodb-client"), ("pymongo", "motor"), "MongoDB"),
        (("firebase",), ("firebase-admin",), "Firebase"),
        (("@supabase/supabase-js",), ("supabase",), "Supabase"),
        (("redis", "ioredis"), ("redis",), "Redis"),
        (("sqlite3", "better-sqlite3"), ("sqlite3", "aiosqlite"), "SQLite"),
    ]

    for npm_names, python_names, label in database_rules:
        if has_npm(*npm_names) or has_python(*python_names):
            add_unique(database, label)

    if has_npm("axios", "@tanstack/react-query", "swr", "ky"):
        add_unique(other, "API Client")

    if has_npm("typescript"):
        add_unique(other, "TypeScript")

    # Only report a package manager if a real manifest exists.
    if any(PurePosixPath(path).name.lower() == "package.json" for path in manifest_paths):
        add_unique(other, "npm")

    if any(PurePosixPath(path).name.lower() in {"requirements.txt", "pyproject.toml"} or PurePosixPath(path).name.lower().startswith("requirements-") for path in manifest_paths):
        add_unique(other, "Python packages")

    return {
        "frontend": frontend,
        "backend": backend,
        "database": database,
        "other": other,
    }


def build_language_percentages(language_data: dict):
    total_bytes = sum(language_data.values())

    if total_bytes <= 0:
        return []

    languages = []

    for language, byte_count in sorted(
        language_data.items(),
        key=lambda item: item[1],
        reverse=True,
    ):
        percentage = round((byte_count / total_bytes) * 100, 2)
        languages.append(
            {
                "name": language,
                "bytes": byte_count,
                "percentage": percentage,
            }
        )

    return languages


def build_top_directories(indexed_files, limit=8):
    counts = {}

    for file in indexed_files:
        parts = PurePosixPath(file.path).parts

        if len(parts) <= 1:
            directory = "/"
        else:
            directory = f"{parts[0]}/"

        counts[directory] = counts.get(directory, 0) + 1

    items = [
        {"path": path, "files": count}
        for path, count in sorted(
            counts.items(),
            key=lambda item: item[1],
            reverse=True,
        )[:limit]
    ]

    return items


def get_indexed_manifest_paths(indexed_files):
    names = {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "requirements-dev.txt",
        "requirements-prod.txt",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "go.mod",
        "composer.json",
        "gemfile",
    }

    paths = []

    for file in indexed_files:
        if PurePosixPath(file.path).name.lower() in names:
            paths.append(file.path)

    # Avoid an unnecessarily large number of GitHub content requests.
    return paths[:40]





def parse_github_repository_url(value: str) -> str:
    """Validate a GitHub repository URL and return owner/name."""
    raw = value.strip()

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="Enter a GitHub repository URL.",
        )

    parsed = urlparse(raw if "://" in raw else f"https://{raw}")

    if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != "github.com":
        raise HTTPException(
            status_code=422,
            detail="Only github.com repository URLs are supported.",
        )

    parts = [part for part in parsed.path.split("/") if part]

    if len(parts) != 2:
        raise HTTPException(
            status_code=422,
            detail="Use a repository URL like https://github.com/owner/repository.",
        )

    owner, repo = parts
    if repo.endswith(".git"):
        repo = repo[:-4]

    if not owner or not repo:
        raise HTTPException(
            status_code=422,
            detail="The GitHub repository URL is incomplete.",
        )

    return f"{owner}/{repo}"


class PublicRepositoryAnalyzeRequest(BaseModel):
    url: str = Field(min_length=1, max_length=500)


def get_public_repository(full_name: str) -> dict:
    """Read public repository metadata without a GitHub App installation."""
    try:
        return github_get(
            f"{GITHUB_API}/repos/{full_name}",
            token=None,
        )
    except HTTPException as error:
        if error.status_code in {401, 403, 404}:
            raise HTTPException(
                status_code=404,
                detail=(
                    "The repository was not found as a public GitHub repository. "
                    "Only public repositories can be analyzed here."
                ),
            ) from error
        raise


async def get_repository_access_for_index(
    repository_index: RepositoryIndex,
    user_id: int,
    db: Session,
):
    """Resolve an indexed repository through GitHub App first, then public API."""
    installation = (
        db.query(GitHubInstallation)
        .filter(GitHubInstallation.user_id == user_id)
        .first()
    )

    if installation is not None:
        try:
            token = await create_installation_access_token(
                installation.installation_id
            )
            response = requests.get(
                f"{GITHUB_API}/repos/{repository_index.full_name}",
                headers=github_headers(token),
                timeout=30,
            )

            if response.status_code == 200:
                return response.json(), token, "OWN"
        except Exception:
            # The indexed repository may still be public even when the user's
            # GitHub App access cannot currently be created or verified.
            pass

    repository = get_public_repository(repository_index.full_name)
    return repository, None, "PUBLIC"


async def get_repository_by_id_for_request(
    repository_id: int,
    user_id: int,
    db: Session,
):
    """Resolve a repository id for both App-owned and previously indexed public repos."""
    repository_index = (
        db.query(RepositoryIndex)
        .filter(
            RepositoryIndex.user_id == user_id,
            RepositoryIndex.github_repository_id == repository_id,
        )
        .first()
    )

    if repository_index is not None:
        return await get_repository_access_for_index(
            repository_index,
            user_id,
            db,
        )

    installation = (
        db.query(GitHubInstallation)
        .filter(GitHubInstallation.user_id == user_id)
        .first()
    )

    if installation is None:
        raise HTTPException(
            status_code=404,
            detail="Repository has not been indexed yet.",
        )

    token = await create_installation_access_token(
        installation.installation_id
    )
    github_repositories = get_installation_repositories(token)

    repository = next(
        (
            item
            for item in github_repositories
            if item.get("id") == repository_id
        ),
        None,
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository is not accessible through GitLoop.",
        )

    return repository, token, "OWN"


def reset_or_create_repository_index(
    *,
    user_id: int,
    repository: dict,
    db: Session,
) -> RepositoryIndex:
    repository_id = int(repository["id"])
    full_name = repository["full_name"]
    default_branch = repository.get("default_branch") or "main"

    repository_index = (
        db.query(RepositoryIndex)
        .filter(
            RepositoryIndex.user_id == user_id,
            RepositoryIndex.github_repository_id == repository_id,
        )
        .first()
    )

    now = datetime.utcnow()

    if repository_index is None:
        repository_index = RepositoryIndex(
            user_id=user_id,
            github_repository_id=repository_id,
            full_name=full_name,
            branch=default_branch,
            status="INDEXING",
            started_at=now,
        )
        db.add(repository_index)
        db.flush()
    else:
        repository_index.full_name = full_name
        repository_index.branch = default_branch
        repository_index.status = "INDEXING"
        repository_index.started_at = now
        repository_index.completed_at = None
        repository_index.error_message = None
        repository_index.files_count = 0
        repository_index.code_files_count = 0
        repository_index.other_files_count = 0
        repository_index.truncated = False

    db.query(RepositoryFile).filter(
        RepositoryFile.repository_index_id == repository_index.id
    ).delete(synchronize_session=False)

    return repository_index


async def run_repository_indexing(
    *,
    user_id: int,
    repository: dict,
    token: str | None,
    db: Session,
):
    """Common indexer used by both GitHub App and public repository flows."""
    repository_index = reset_or_create_repository_index(
        user_id=user_id,
        repository=repository,
        db=db,
    )

    try:
        tree_data = get_repository_tree(
            token=token,
            full_name=repository["full_name"],
            branch=repository.get("default_branch") or "main",
        )

        tree_items = tree_data.get("tree", [])
        tree_truncated = tree_data.get("truncated", False)
        file_records = []

        for item in tree_items:
            if item.get("type") != "blob":
                continue

            path = item.get("path")
            if not path:
                continue

            size = item.get("size")
            if should_ignore(path, size):
                continue

            filename, extension, language, category = get_file_information(path)
            file_records.append(
                RepositoryFile(
                    repository_index_id=repository_index.id,
                    path=path,
                    filename=filename,
                    extension=extension,
                    language=language,
                    category=category,
                    size=size,
                    sha=item.get("sha", ""),
                )
            )

            if len(file_records) >= MAX_FILES:
                break

        db.add_all(file_records)

        files_count = len(file_records)
        code_files_count = sum(
            1
            for file in file_records
            if file.category in {"code", "config"}
        )
        other_files_count = files_count - code_files_count

        repository_index.files_count = files_count
        repository_index.code_files_count = code_files_count
        repository_index.other_files_count = other_files_count
        repository_index.truncated = tree_truncated or len(tree_items) > MAX_FILES
        repository_index.status = (
            "PARTIAL" if repository_index.truncated else "COMPLETED"
        )
        repository_index.completed_at = datetime.utcnow()

        db.commit()

        return {
            "success": True,
            "status": repository_index.status,
            "repository_id": int(repository["id"]),
            "full_name": repository["full_name"],
            "branch": repository.get("default_branch") or "main",
            "files_indexed": files_count,
            "code_files": code_files_count,
            "other_files": other_files_count,
            "truncated": repository_index.truncated,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()

        existing_index = (
            db.query(RepositoryIndex)
            .filter(
                RepositoryIndex.user_id == user_id,
                RepositoryIndex.github_repository_id == int(repository["id"]),
            )
            .first()
        )
        if existing_index:
            existing_index.status = "FAILED"
            existing_index.error_message = str(error)
            db.commit()

        print("Repository indexing error:", error)
        raise HTTPException(
            status_code=500,
            detail="Repository indexing failed.",
        ) from error


@router.get("/repositories/{repository_id}/information")
async def get_repository_information(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]

    try:
        repository, token, source = await get_repository_by_id_for_request(
            repository_id,
            user_id,
            db,
        )

        full_name = repository.get("full_name")
        default_branch = repository.get("default_branch") or "main"

        repository_index = (
            db.query(RepositoryIndex)
            .filter(
                RepositoryIndex.user_id == user_id,
                RepositoryIndex.github_repository_id == repository_id,
            )
            .first()
        )

        index_status = (
            repository_index.status
            if repository_index is not None
            else "NOT_INDEXED"
        )
        indexed = index_status in {"COMPLETED", "PARTIAL"}

        statistics = {
            "files": 0,
            "code": 0,
            "config": 0,
            "documentation": 0,
            "other": 0,
            "indexed_bytes": 0,
        }
        languages = []
        stack = {
            "frontend": [],
            "backend": [],
            "database": [],
            "other": [],
        }
        branches = []
        recent_commits = []
        top_directories = []
        manifests = []

        if indexed and repository_index is not None:
            indexed_files = (
                db.query(RepositoryFile)
                .filter(RepositoryFile.repository_index_id == repository_index.id)
                .all()
            )

            statistics["files"] = len(indexed_files)
            statistics["code"] = sum(1 for file in indexed_files if file.category == "code")
            statistics["config"] = sum(1 for file in indexed_files if file.category == "config")
            statistics["documentation"] = sum(
                1 for file in indexed_files if file.category == "documentation"
            )
            statistics["other"] = sum(1 for file in indexed_files if file.category == "other")
            statistics["indexed_bytes"] = sum((file.size or 0) for file in indexed_files)

            language_data = github_get(
                f"{GITHUB_API}/repos/{full_name}/languages",
                token,
            )
            languages = build_language_percentages(language_data)

            manifest_paths = get_indexed_manifest_paths(indexed_files)
            for path in manifest_paths:
                content = get_github_file_content(
                    token,
                    full_name,
                    path,
                    default_branch,
                )
                if content is not None:
                    manifests.append({"path": path, "content": content})

            stack = detect_stack_from_manifests(manifests)
            top_directories = build_top_directories(indexed_files)

        branch_data = github_get(
            f"{GITHUB_API}/repos/{full_name}/branches",
            token,
            params={"per_page": 100, "page": 1},
        )
        branches = [
            {
                "name": branch.get("name"),
                "protected": branch.get("protected", False),
            }
            for branch in branch_data
        ]

        commit_data = github_get(
            f"{GITHUB_API}/repos/{full_name}/commits",
            token,
            params={"per_page": 5, "page": 1},
        )
        recent_commits = [
            {
                "sha": commit.get("sha"),
                "message": (
                    commit.get("commit", {})
                    .get("message", "")
                    .split("\n")[0]
                ),
                "author": (
                    (commit.get("author", {}) or {}).get("login")
                    or (commit.get("commit", {}).get("author", {}) or {}).get("name")
                ),
                "date": (commit.get("commit", {}).get("author", {}) or {}).get("date"),
                "url": commit.get("html_url"),
            }
            for commit in commit_data
        ]

        repository_size_kb = repository.get("size")
        repository_size_mb = None
        if isinstance(repository_size_kb, (int, float)):
            repository_size_mb = round(repository_size_kb / 1024, 2)

        indexed_size_mb = round(statistics["indexed_bytes"] / (1024 * 1024), 2)

        return {
            "repository": {
                "id": repository.get("id"),
                "name": repository.get("name"),
                "full_name": full_name,
                "owner": (repository.get("owner", {}) or {}).get("login"),
                "description": repository.get("description"),
                "private": repository.get("private", False),
                "visibility": repository.get("visibility"),
                "default_branch": default_branch,
                "html_url": repository.get("html_url"),
                "created_at": repository.get("created_at"),
                "updated_at": repository.get("updated_at"),
                "pushed_at": repository.get("pushed_at"),
                "stars": repository.get("stargazers_count", 0),
                "forks": repository.get("forks_count", 0),
                "open_issues": repository.get("open_issues_count", 0),
                "size_kb": repository_size_kb,
                "size_mb": repository_size_mb,
                "source": source,
            },
            "index": {
                "status": index_status,
                "branch": repository_index.branch if repository_index is not None else default_branch,
                "files_indexed": repository_index.files_count if repository_index is not None else 0,
                "truncated": repository_index.truncated if repository_index is not None else False,
                "started_at": repository_index.started_at if repository_index is not None else None,
                "completed_at": repository_index.completed_at if repository_index is not None else None,
                "error_message": repository_index.error_message if repository_index is not None else None,
            },
            "statistics": {
                **statistics,
                "indexed_size_mb": indexed_size_mb,
            },
            "languages": languages,
            "branches": {"count": len(branches), "items": branches},
            "stack": stack,
            "top_directories": top_directories,
            "recent_commits": recent_commits,
            "manifests": [manifest["path"] for manifest in manifests],
        }

    except HTTPException:
        raise
    except requests.RequestException as error:
        print("Repository information GitHub error:", error)
        raise HTTPException(
            status_code=502,
            detail="Unable to load repository information from GitHub.",
        ) from error
    except Exception as error:
        import traceback
        print("Repository information error:", error)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Unable to load repository information.",
        ) from error


@router.post("/repositories/{repository_id}/index")
async def index_repository(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]

    repository, token, _source = await get_repository_by_id_for_request(
        repository_id,
        user_id,
        db,
    )

    return await run_repository_indexing(
        user_id=user_id,
        repository=repository,
        token=token,
        db=db,
    )


@router.post("/repositories/public/analyze")
async def analyze_public_repository(
    payload: PublicRepositoryAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]
    full_name = parse_github_repository_url(payload.url)
    repository = get_public_repository(full_name)

    if repository.get("private"):
        raise HTTPException(
            status_code=403,
            detail="Only public repositories can be analyzed here.",
        )

    result = await run_repository_indexing(
        user_id=user_id,
        repository=repository,
        token=None,
        db=db,
    )
    result["source"] = "PUBLIC"
    return result


@router.get("/repositories/public")
async def get_public_indexed_repositories(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]
    indexes = (
        db.query(RepositoryIndex)
        .filter(RepositoryIndex.user_id == user_id)
        .order_by(RepositoryIndex.started_at.desc())
        .all()
    )

    own_repository_ids = set()
    installation = (
        db.query(GitHubInstallation)
        .filter(GitHubInstallation.user_id == user_id)
        .first()
    )
    if installation is not None:
        try:
            token = await create_installation_access_token(
                installation.installation_id
            )
            own_repository_ids = {
                int(repository.get("id"))
                for repository in get_installation_repositories(token)
                if repository.get("id") is not None
            }
        except Exception:
            own_repository_ids = set()

    public_repositories = []

    for repository_index in indexes:
        if repository_index.github_repository_id in own_repository_ids:
            continue
        try:
            repository = get_public_repository(repository_index.full_name)
        except HTTPException:
            continue

        if repository.get("private"):
            continue

        public_repositories.append(
            {
                "id": repository.get("id"),
                "name": repository.get("name"),
                "full_name": repository.get("full_name"),
                "owner": (repository.get("owner", {}) or {}).get("login"),
                "description": repository.get("description"),
                "private": False,
                "default_branch": repository.get("default_branch"),
                "html_url": repository.get("html_url"),
                "stars": repository.get("stargazers_count", 0),
                "forks": repository.get("forks_count", 0),
                "pushed_at": repository.get("pushed_at"),
                "index": {
                    "status": repository_index.status,
                    "files_indexed": repository_index.files_count,
                    "truncated": repository_index.truncated,
                    "started_at": repository_index.started_at,
                    "completed_at": repository_index.completed_at,
                    "error_message": repository_index.error_message,
                },
                "source": "PUBLIC",
            }
        )

    return {"repositories": public_repositories}

