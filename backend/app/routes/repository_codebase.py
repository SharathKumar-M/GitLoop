from base64 import b64decode
from urllib.parse import quote

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.github_installation import GitHubInstallation
from app.models.repository_file import RepositoryFile
from app.models.repository_index import RepositoryIndex
from app.routes.auth import get_current_user
from app.services.github_app_service import create_installation_access_token


router = APIRouter(
    tags=["Repository Codebase"],
)


GITHUB_API = "https://api.github.com"
GITHUB_API_VERSION = "2026-03-10"


def github_headers(token: str):
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }


def get_repository_index(
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

    return repository_index


@router.get("/repositories/{repository_id}/files")
def get_repository_files(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]

    repository_index = get_repository_index(
        repository_id=repository_id,
        user_id=user_id,
        db=db,
    )

    files = (
        db.query(RepositoryFile)
        .filter(
            RepositoryFile.repository_index_id == repository_index.id
        )
        .order_by(RepositoryFile.path.asc())
        .all()
    )

    return {
        "repository_id": repository_id,
        "full_name": repository_index.full_name,
        "branch": repository_index.branch,
        "status": repository_index.status,
        "files_count": repository_index.files_count,
        "code_files_count": repository_index.code_files_count,
        "other_files_count": repository_index.other_files_count,
        "truncated": repository_index.truncated,
        "files": [
            {
                "id": file.id,
                "path": file.path,
                "filename": file.filename,
                "extension": file.extension,
                "language": file.language,
                "category": file.category,
                "size": file.size,
                "sha": file.sha,
            }
            for file in files
        ],
    }


@router.get("/repositories/{repository_id}/file-content")
async def get_repository_file_content(
    repository_id: int,
    path: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]

    repository_index = get_repository_index(
        repository_id=repository_id,
        user_id=user_id,
        db=db,
    )

    repository_file = (
        db.query(RepositoryFile)
        .filter(
            RepositoryFile.repository_index_id == repository_index.id,
            RepositoryFile.path == path,
        )
        .first()
    )

    if repository_file is None:
        raise HTTPException(
            status_code=404,
            detail="File was not found in the indexed repository.",
        )

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

    token = await create_installation_access_token(
        installation.installation_id
    )

    encoded_sha = quote(repository_file.sha, safe="")

    response = requests.get(
        f"{GITHUB_API}/repos/{repository_index.full_name}/git/blobs/{encoded_sha}",
        headers=github_headers(token),
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Unable to fetch file content from GitHub.",
        )

    data = response.json()

    if data.get("encoding") != "base64":
        raise HTTPException(
            status_code=422,
            detail="GitHub returned an unsupported file encoding.",
        )

    try:
        content = b64decode(data.get("content", "")).decode(
            "utf-8",
            errors="replace",
        )
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Unable to decode file content.",
        )

    return {
        "repository_id": repository_id,
        "path": repository_file.path,
        "filename": repository_file.filename,
        "language": repository_file.language,
        "category": repository_file.category,
        "size": repository_file.size,
        "content": content,
    }