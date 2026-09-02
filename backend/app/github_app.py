from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth_dependencies import get_current_user
from app.models.github_installation import GitHubInstallation
from app.models.user import User

from app.services.github_app_service import (
    create_github_app_jwt,
    create_installation_access_token,
    get_installation_repositories,
)


# ============================================================
# GITHUB APP ROUTER
# ============================================================

router = APIRouter(
    prefix="/github/app",
    tags=["GitLoop App"],
)


# ============================================================
# REAL GITHUB API ROUTER
# ============================================================

api_router = APIRouter(
    tags=["GitHub"],
)


# ============================================================
# TEST: GITHUB APP JWT
# ============================================================

@router.get("/test-auth")
async def test_github_app_auth():
    token = create_github_app_jwt()

    return {
        "message": "GitHub App JWT created successfully",
        "token_created": bool(token),
    }


# ============================================================
# GITHUB APP SETUP
# ============================================================

@router.get("/setup", response_class=HTMLResponse)
async def github_app_setup(
    installation_id: int = Query(...),
    setup_action: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Check whether this installation already exists
    # --------------------------------------------------------

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id == installation_id
        )
        .first()
    )

    # --------------------------------------------------------
    # Create installation if it doesn't exist
    # --------------------------------------------------------

    if installation is None:
        installation = GitHubInstallation(
            installation_id=installation_id,
            user_id=current_user.id,
        )

        db.add(installation)
        db.commit()
        db.refresh(installation)

        message = "GitHub App installation saved successfully."

    else:
        # ----------------------------------------------------
        # Installation already exists
        # Make sure it belongs to the current user
        # ----------------------------------------------------

        if installation.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This GitHub App installation belongs to another user.",
            )

        message = "GitHub App installation already connected."


    # --------------------------------------------------------
    # Temporary success page
    # --------------------------------------------------------

    return f"""
    <html>
        <head>
            <title>GitLoop - GitHub Connected</title>
        </head>

        <body style="
            background: #05050b;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        ">

            <div style="
                text-align: center;
                padding: 40px;
                border: 1px solid #29243d;
                border-radius: 20px;
                background: #0b0a13;
                max-width: 600px;
            ">

                <h1>GitHub Connected ✓</h1>

                <p style="color: #aaa;">
                    {message}
                </p>

                <p>
                    GitHub User:
                    <strong>{current_user.username}</strong>
                </p>

                <p>
                    Installation ID:
                    <strong>{installation_id}</strong>
                </p>

                <p style="color: #888;">
                    Setup action:
                    {setup_action or "unknown"}
                </p>

            </div>

        </body>
    </html>
    """


# ============================================================
# TEST: INSTALLATION ACCESS TOKEN
# ============================================================

@router.get("/test-installation-token")
async def test_installation_token():

    # Development testing only
    installation_id = 156640279

    token = await create_installation_access_token(
        installation_id
    )

    return {
        "message": "Installation access token created successfully",
        "token_created": bool(token),
    }


# ============================================================
# REAL API: GET USER'S GITHUB REPOSITORIES
# ============================================================

@api_router.get("/repositories")
async def get_repositories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find GitHub App installation for current user
    # --------------------------------------------------------

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.user_id == current_user.id
        )
        .first()
    )

    # --------------------------------------------------------
    # Installation not connected
    # --------------------------------------------------------

    if installation is None:
        return {
            "message": "GitHub App installation not found",
            "user": current_user.username,
            "repositories": [],
        }

    # --------------------------------------------------------
    # Get repositories from GitHub
    # --------------------------------------------------------

    data = await get_installation_repositories(
        installation.installation_id
    )

    repositories = data.get("repositories", [])

    # --------------------------------------------------------
    # Return clean API response
    # --------------------------------------------------------

    return {
        "user": current_user.username,
        "installation_id": installation.installation_id,
        "total_count": data.get("total_count", 0),
        "repositories": [
            {
                "id": repo.get("id"),
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "private": repo.get("private"),
                "language": repo.get("language"),
                "default_branch": repo.get("default_branch"),
                "html_url": repo.get("html_url"),
            }
            for repo in repositories
        ],
    }