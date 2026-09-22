from datetime import datetime
from pathlib import PurePosixPath
from urllib.parse import quote

import requests
from fastapi import APIRouter, Depends, HTTPException
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


def github_headers(token: str):
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }


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
    token: str,
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


@router.post("/repositories/{repository_id}/index")
async def index_repository(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # get_current_user() returns a dictionary
    user_id = current_user["id"]

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.user_id == user_id
        )
        .first()
    )

    if installation is None:
        raise HTTPException(
            status_code=400,
            detail="GitHub App installation not found.",
        )

    try:
        token = await create_installation_access_token(
            installation.installation_id
        )

        github_repositories = get_installation_repositories(token)

        selected_repository = next(
            (
                repository
                for repository in github_repositories
                if repository.get("id") == repository_id
            ),
            None,
        )

        if selected_repository is None:
            raise HTTPException(
                status_code=404,
                detail="Repository is not accessible through GitLoop.",
            )

        full_name = selected_repository["full_name"]

        default_branch = selected_repository.get(
            "default_branch",
            "main",
        )

        repository_index = (
            db.query(RepositoryIndex)
            .filter(
                RepositoryIndex.user_id == user_id,
                RepositoryIndex.github_repository_id
                == repository_id,
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

        # Remove previous file metadata
        db.query(RepositoryFile).filter(
            RepositoryFile.repository_index_id
            == repository_index.id
        ).delete(
            synchronize_session=False
        )

        tree_data = get_repository_tree(
            token=token,
            full_name=full_name,
            branch=default_branch,
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

            filename, extension, language, category = (
                get_file_information(path)
            )

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
            if file.category in {
                "code",
                "config",
            }
        )

        other_files_count = (
            files_count - code_files_count
        )

        repository_index.files_count = files_count
        repository_index.code_files_count = code_files_count
        repository_index.other_files_count = other_files_count
        repository_index.truncated = (
            tree_truncated
            or len(tree_items) > MAX_FILES
        )

        if repository_index.truncated:
            repository_index.status = "PARTIAL"
        else:
            repository_index.status = "COMPLETED"

        repository_index.completed_at = datetime.utcnow()

        db.commit()

        return {
            "success": True,
            "status": repository_index.status,
            "repository_id": repository_id,
            "full_name": full_name,
            "branch": default_branch,
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
                RepositoryIndex.github_repository_id
                == repository_id,
            )
            .first()
        )

        if existing_index:
            existing_index.status = "FAILED"
            existing_index.error_message = str(error)
            db.commit()

        print(
            "Repository indexing error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Repository indexing failed.",
        )