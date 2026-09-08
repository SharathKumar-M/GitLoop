import asyncio
import httpx
import os
import time

from datetime import datetime, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv


load_dotenv()


GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_APP_PRIVATE_KEY_PATH = os.getenv(
    "GITHUB_APP_PRIVATE_KEY_PATH"
)


# ============================================================
# PRIVATE KEY
# ============================================================

def load_private_key() -> str:
    """
    Read the GitHub App private key from disk.
    """

    if not GITHUB_APP_PRIVATE_KEY_PATH:
        raise RuntimeError(
            "GITHUB_APP_PRIVATE_KEY_PATH is not configured"
        )

    private_key_path = Path(
        GITHUB_APP_PRIVATE_KEY_PATH
    )

    if not private_key_path.exists():
        raise FileNotFoundError(
            f"GitHub App private key not found: "
            f"{private_key_path}"
        )

    return private_key_path.read_text(
        encoding="utf-8"
    )


# ============================================================
# GITHUB APP JWT
# ============================================================

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


# ============================================================
# INSTALLATION ACCESS TOKEN
# ============================================================

async def create_installation_access_token(
    installation_id: int,
) -> str:
    """
    Create a short-lived installation access token
    for a specific GitHub App installation.
    """

    app_jwt = create_github_app_jwt()

    url = (
        "https://api.github.com/app/installations/"
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
            headers=headers,
        )

        if response.status_code != 201:
            raise RuntimeError(
                "Failed to create GitHub installation "
                "access token: "
                f"{response.status_code} {response.text}"
            )

        data = response.json()

        token = data.get("token")

        if not token:
            raise RuntimeError(
                "GitHub did not return an installation "
                "access token"
            )

        return token


# ============================================================
# INSTALLATION REPOSITORIES
# ============================================================

async def get_installation_repositories(
    installation_id: int,
) -> dict:
    """
    Fetch repositories accessible to a GitHub App installation.
    """

    token = await create_installation_access_token(
        installation_id
    )

    url = (
        "https://api.github.com/"
        "installation/repositories"
    )

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


# ============================================================
# RECENT GITHUB ACTIVITY
# ============================================================

async def get_recent_activity(
    installation_id: int,
    username: str,
    limit: int = 10,
):
    """
    Get recent GitHub activity performed by the
    current user across repositories accessible to
    the GitHub App installation.

    Currently tracks:
    - Commits
    - Pull requests
    """

    token = await create_installation_access_token(
        installation_id
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # --------------------------------------------------------
    # Get repositories available to the installation
    # --------------------------------------------------------

    repository_data = await get_installation_repositories(
        installation_id
    )

    repositories = repository_data.get(
        "repositories",
        []
    )

    if not repositories:
        return []

    # --------------------------------------------------------
    # Limit simultaneous GitHub requests
    # --------------------------------------------------------

    semaphore = asyncio.Semaphore(5)


    async def fetch_repository_activity(repo):
        async with semaphore:

            full_name = repo.get("full_name")

            if not full_name:
                return []

            activities = []

            async with httpx.AsyncClient() as client:

                # ====================================================
                # COMMITS
                # ====================================================

                try:
                    commit_response = await client.get(
                        f"https://api.github.com/repos/"
                        f"{full_name}/commits",
                        headers=headers,
                        params={
                            "author": username,
                            "per_page": 5,
                            "page": 1,
                        },
                    )

                    if commit_response.status_code == 200:

                        commits = (
                            commit_response.json()
                        )

                        for commit in commits:

                            commit_data = (
                                commit.get("commit", {})
                            )

                            author_data = (
                                commit_data.get(
                                    "author",
                                    {}
                                )
                            )

                            date_string = (
                                author_data.get("date")
                            )

                            activities.append(
                                {
                                    "type": "commit",
                                    "repo_name": repo.get(
                                        "name"
                                    ),
                                    "repo_full_name": (
                                        full_name
                                    ),
                                    "message": (
                                        commit_data.get(
                                            "message",
                                            ""
                                        )
                                        .split("\n")[0]
                                    ),
                                    "sha": commit.get(
                                        "sha"
                                    ),
                                    "url": commit.get(
                                        "html_url"
                                    ),
                                    "timestamp": (
                                        date_string
                                    ),
                                }
                            )

                except Exception as exc:
                    print(
                        "Failed to fetch commits for "
                        f"{full_name}: {exc}"
                    )


                # ====================================================
                # PULL REQUESTS
                # ====================================================

                try:
                    pull_response = await client.get(
                        f"https://api.github.com/repos/"
                        f"{full_name}/pulls",
                        headers=headers,
                        params={
                            "state": "all",
                            "sort": "updated",
                            "direction": "desc",
                            "per_page": 10,
                            "page": 1,
                        },
                    )

                    if pull_response.status_code == 200:

                        pulls = (
                            pull_response.json()
                        )

                        for pull in pulls:

                            pull_user = (
                                pull.get("user") or {}
                            )

                            pull_username = (
                                pull_user.get("login")
                            )

                            if not pull_username:
                                continue

                            if (
                                pull_username.lower()
                                != username.lower()
                            ):
                                continue

                            activities.append(
                                {
                                    "type": "pull_request",
                                    "repo_name": repo.get(
                                        "name"
                                    ),
                                    "repo_full_name": (
                                        full_name
                                    ),
                                    "message": pull.get(
                                        "title",
                                        "Pull request",
                                    ),
                                    "number": pull.get(
                                        "number"
                                    ),
                                    "state": pull.get(
                                        "state"
                                    ),
                                    "url": pull.get(
                                        "html_url"
                                    ),
                                    "timestamp": pull.get(
                                        "updated_at"
                                    ),
                                }
                            )

                except Exception as exc:
                    print(
                        "Failed to fetch pull requests "
                        f"for {full_name}: {exc}"
                    )

            return activities


    # --------------------------------------------------------
    # Fetch activity from all repositories
    # --------------------------------------------------------

    results = await asyncio.gather(
        *[
            fetch_repository_activity(repo)
            for repo in repositories
        ]
    )


    # --------------------------------------------------------
    # Flatten results
    # --------------------------------------------------------

    activities = []

    for repo_activities in results:
        activities.extend(repo_activities)


    # --------------------------------------------------------
    # Sort newest → oldest
    # --------------------------------------------------------

    def parse_timestamp(activity):

        timestamp = activity.get(
            "timestamp"
        )

        if not timestamp:
            return datetime.min.replace(
                tzinfo=timezone.utc
            )

        try:
            return datetime.fromisoformat(
                timestamp.replace(
                    "Z",
                    "+00:00"
                )
            )

        except ValueError:
            return datetime.min.replace(
                tzinfo=timezone.utc
            )


    activities.sort(
        key=parse_timestamp,
        reverse=True,
    )


    return activities[:limit]