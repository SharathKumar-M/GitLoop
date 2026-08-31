

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



