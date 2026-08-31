
import httpx
import os
import time
from pathlib import Path

import jwt
from dotenv import load_dotenv

load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_APP_PRIVATE_KEY_PATH = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")

def load_private_key() -> str:
    """
    Read the GitHub App private key from disk.
    """
    if not GITHUB_APP_PRIVATE_KEY_PATH:
        raise RuntimeError(
             "GITHUB_APP_PRIVATE_KEY_PATH is not configured"
        )

    private_key_path = Path(GITHUB_APP_PRIVATE_KEY_PATH)

    if not private_key_path.exists():
        raise FileNotFoundError(
            f"Github App private key not found: {private_key_path}"

        )

    return private_key_path.read_text(encoding="utf-8")


def create_github_app_jwt() -> str:
    """
    Create a short-lived JWT identifying our GitHub App.
    """
    if not GITHUB_APP_ID:
        raise RuntimeError(
            "GITHUB_APP_ID is not configured"
        )

    private_key = load_private_key()

    now = int(time.time())

    payload = {
        "iat": now - 60,
        "exp": now + (9 * 60),
        "iss": GITHUB_APP_ID,
    }

    token = jwt.encode(
        payload, 
        private_key,
        algorithm="RS256",
    )

    return token



async def create_installation_access_token(
        installation_id: int,
) -> str:
     """
    Create a short-lived installation access token
    for a specific GitHub App installation.
    """
     app_jwt = create_github_app_jwt()

     url = (
         f"https://api.github.com/app/installations/"
         f"{installation_id}/access_tokens"

     )

     headers = {
         "Authorization": f"Bearer {app_jwt}",
         "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
     }

     async with httpx.AsyncClient() as client:
         response = await client.post(
             url,
             headers= headers,
         )

         if response.status_code != 201:
             raise RuntimeError(
                 "Failed to create GitHub installation access token: "
                 f"{response.status_code} {response.text}"
             )

         data = response.json()

         token = data.get("token")

         if not token:
             raise RuntimeError(
                   "GitHub did not return an installation access token"
             )

         return token



async def get_installation_repositories(
    installation_id: int,
) -> dict:
    """
    Fetch repositories accessible to a GitHub App installation.
    """

    token = await create_installation_access_token(
        installation_id
    )

    url = "https://api.github.com/installation/repositories"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    params = {
        "per_page": 100,
        "page": 1,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers=headers,
            params=params,
        )

    if response.status_code != 200:
        raise RuntimeError(
            "Failed to fetch GitHub repositories: "
            f"{response.status_code} {response.text}"
        )

    return response.json()








