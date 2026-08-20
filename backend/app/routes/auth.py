import os
import secrets
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])


GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://127.0.0.1:8000/auth/github/callback",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)


@router.get("/github")
async def github_login(response: Response):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID is not configured",
        )

    # Generate CSRF protection state
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "state": state,
        "scope": "read:user user:email",
    }

    github_url = (
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )

    redirect_response = RedirectResponse(
        url=github_url
    )

    redirect_response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=600,
    )

    return redirect_response


@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    oauth_state: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    # -------------------------------------
    # 1. Validate OAuth state
    # -------------------------------------

    if not oauth_state or state != oauth_state:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state",
        )

    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth credentials are not configured",
        )

    # -------------------------------------
    # 2. Exchange authorization code
    # -------------------------------------

    token_url = (
        "https://github.com/login/oauth/access_token"
    )

    token_payload = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI,
    }

    token_headers = {
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_url,
            data=token_payload,
            headers=token_headers,
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to exchange GitHub authorization code",
        )

    token_data = token_response.json()

    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail=token_data,
        )

    # -------------------------------------
    # 3. Get GitHub user
    # -------------------------------------

    github_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers=github_headers,
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to fetch GitHub user",
        )

    github_user = user_response.json()

    github_id = str(github_user["id"])
    username = github_user.get("login")
    avatar_url = github_user.get("avatar_url")

    # GitHub may not expose email in /user.
    # We'll leave it nullable for now.
    email = github_user.get("email")

    # -------------------------------------
    # 4. Find existing user
    # -------------------------------------

    user = (
        db.query(User)
        .filter(User.github_id == github_id)
        .first()
    )

    # -------------------------------------
    # 5. Create or update user
    # -------------------------------------

    if user is None:

        user = User(
            github_id=github_id,
            username=username,
            email=email,
            avatar_url=avatar_url,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    else:

        user.username = username
        user.email = email
        user.avatar_url = avatar_url

        db.commit()
        db.refresh(user)

    # -------------------------------------
    # 6. Temporary redirect
    # -------------------------------------

    frontend_url = FRONTEND_URL.rstrip("/")

    redirect_response = RedirectResponse(
        url=f"{frontend_url}/login?github={user.username}"
    )

    # Remove OAuth state cookie
    redirect_response.delete_cookie("oauth_state")

    return redirect_response