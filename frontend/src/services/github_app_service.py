import asyncio
from datetime import datetime, timezone

from backend.app.services.github_app_service import get_installation_repositories

async def get_recent_activity(
        installation_id: int,
        username: str,
        limit: int = 10,
):
    """
    Get recent GitHub activity performed by the current user
    across repositories accessible to the GitHub App installation.

    Currently tracks:
    - Commits
    - Pull requests
    """

    access_token = await create_installation_access_token(installation_id)

    headers = {
         "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


    # --------------------------------------------------------
    # Get all repositories accessible to the installation
    # --------------------------------------------------------


    repository_data = await get_installation_repositories(
        installation_id
        
    )

    repositories = repository_data.get("repositories", [])

    if not repositories:
        return []


     # --------------------------------------------------------
    # Limit concurrency so we don't fire too many requests
    # at once.
    # --------------------------------------------------------


    semaphore = asyncio.Semaphore(5)

    async def fetch_repository_activity(repo):
        async with semaphore:
            full_name = repo.get("full_name")

            if not full_name:
                return []

            activities = []

            async with httpx.AsyncClient() as client:

                  # ------------------------------------------------
                # Recent commits by this user
                # ------------------------------------------------

                try:
                    commit_response = await client.get(
                        f"https://api.github.com/repos/{full_name}/commits",
                        headers = headers,
                        params ={
                            "author": username,
                            "per_page": 5,
                            "page": 1,
                        },
                    )

                    if commit_response.status_code == 200:
                        commits = commit_response.json()

                        for commit in commits:
                            commit_data = commit.get("commit", {})
                            author_data = commit_data.get("author", {} )


                            date_string = author_data.get("date")

                            activities.append(
                                {
                                     "type": "commit",
                                    "repo_name": repo.get("name"),
                                    "repo_full_name": full_name,
                                    "message": commit_data.get(
                                        "message",
                                        ""
                                    ).split("\n")[0],
                                    "sha": commit.get("sha"),
                                    "url": commit.get(
                                        "html_url"
                                    ),
                                    "timestamp": date_string,
                                }
                            )

                except Exception:
                    pass


                  # ------------------------------------------------
                # Recent pull requests by this user
                # ------------------------------------------------

                try:
                    pull_response = await client.get(
                        f"https://api.github.com/repos/{full_name}/pulls",
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
                        pulls = pull_response.json()

                        for pull in pulls:

                            pull_user = (
                                pull.get("user") or {}
                            )

                            if (
                                pull_user.get("login", "").lower()
                                != username.lower()
                            ):
                                continue

                            activities.append(
                                {
                                    "type": "pull_request",
                                    "repo_name": repo.get("name"),
                                    "repo_full_name": full_name,
                                    "message": pull.get(
                                        "title",
                                        "Pull request",
                                    ),
                                    "number": pull.get("number"),
                                    "state": pull.get("state"),
                                    "url": pull.get(
                                        "html_url"
                                    ),
                                    "timestamp": pull.get(
                                        "updated_at"
                                    ),
                                }
                            )

                except Exception:
                    pass

            return activities


    # --------------------------------------------------------
    # Fetch activity from repositories
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
        timestamp = activity.get("timestamp")

        if not timestamp:
            return datetime.min.replace(
                tzinfo=timezone.utc
            )

        try:
            return datetime.fromisoformat(
                timestamp.replace("Z", "+00:00")
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
                        
                            





