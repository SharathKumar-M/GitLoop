import os
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.session import Session as DbSession
from app.models.user import User

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])


GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://localhost:8000/auth/github/callback",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

SESSION_COOKIE_NAME = "gitloop_session"
SESSION_DAYS = 7  # Session expiration in days


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

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
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
            detail="GitHub did not return an access token",
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

    # GitHub may not expose an email address in /user.  The database column is
    # nullable, so sign-in remains possible for users who keep it private.
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

    try:
        if user is None:
            user = User(
                github_id=github_id,
                username=username,
                email=email,
                avatar_url=avatar_url,
            )
            db.add(user)
        else:
            user.username = username
            user.email = email
            user.avatar_url = avatar_url

        db.commit()
        db.refresh(user)

    # -------------------------------------
    # 6. Create session
    # -------------------------------------

        db.query(DbSession).filter(
            DbSession.user_id == user.id
        ).delete()

        session_token = secrets.token_urlsafe(48)
        expires_at = datetime.utcnow() + timedelta(days=SESSION_DAYS)
        db.add(
            DbSession(
                session_token=session_token,
                user_id=user.id,
                expires_at=expires_at,
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save GitHub sign-in data",
        ) from exc

    # -------------------------------------
    # Redirect to frontend
    # -------------------------------------

    frontend_url = FRONTEND_URL.rstrip("/")

    response = RedirectResponse(
        url=f"{frontend_url}/dashboard"
    )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )

    return response

@router.get("/me")
def get_current_user(
    gitloop_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not gitloop_session:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    session = (
        db.query(DbSession)
        .filter(DbSession.session_token == gitloop_session)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid session",
        )

    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired",
        )

    user = (
        db.query(User)
        .filter(User.id == session.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "id": user.id,
        "github_id": user.github_id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }


@router.post("/logout")
def logout(
    gitloop_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if gitloop_session:
        session = (
            db.query(DbSession)
            .filter(
                DbSession.session_token == gitloop_session
            )
            .first()
        )

        if session:
            db.delete(session)
            db.commit()

    response = RedirectResponse(
        url=f"{FRONTEND_URL.rstrip('/')}/login",
        status_code=303,
    )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )

    return response

