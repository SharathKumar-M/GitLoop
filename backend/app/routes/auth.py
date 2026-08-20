import os
import secrets
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, params
from fastapi.responses import RedirectResponse

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://127.0.0.1:8000/auth/github/callback",
                                )
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173",)


@router.get("/github")
async def github_login():
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub client ID is not configured.",)

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_url": GITHUB_REDIRECT_URI,
        "state": state,
        "scope": "read:user user:email",
    }

    github_url = (
         "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )

    response = RedirectResponse(url=github_url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=600,
    )

    return response

@router.get("/github/callback")
async def github_callback(code: str, state: str):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Github OAuth credentials are not configured",
        )

    token_url = "https://github.com/login/oauth/access_token"

    token_payload ={
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI,
    }

    headers = {
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_url,
            data=token_payload,
            headers=headers,
        )
    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail= "Failed to exchange Github authorization code",
        )

    token_data = token_response.json()

    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail=token_data,
        )

    user_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers=user_headers,
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to fetch GitHub user",
        )

    user = user_response.json()

    # For now we simply send the user back to the frontend.
    # In the next step we'll create a real backend session
    # and store the user in PostgreSQL.

    username = user.get("login", "github-user")

    return RedirectResponse(
    url=f"{FRONTEND_URL.rstrip('/')}/login?github={username}"
)

