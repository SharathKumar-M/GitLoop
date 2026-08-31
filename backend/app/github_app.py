from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse
from app.services.github_app_service import create_github_app_jwt

router = APIRouter(prefix="/github/app", tags=["Gitloop App"])

@router.get("/test-auth")
async def test_github_app_auuth():
     token = create_github_app_jwt()

     return{
          "message": "GitHub App JWT created successfully",
        "token_created": bool(token),
     }



@router.get("/setup", response_class=HTMLResponse)
async def github_app_setup(
    installation_id: int = Query(...),
    setup_action: str | None = None,

):

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
            ">

                <h1>GitHub Connected ✓</h1>

                <p style="color: #aaa;">
                    GitLoop has received your GitHub App installation.
                </p>

                <p>
                    Installation ID:
                    <strong>{installation_id}</strong>
                </p>

                <p style="color: #888;">
                    Setup action: {setup_action or "unknown"}
                </p>

            </div>

        </body>
    </html>
    """



from app.services.github_app_service import (
     create_github_app_jwt,
     create_installation_access_token,
     get_installation_repositories,
)


@router.get("/test-installation-token")
async def test_installation_token():
     
     installation_id = 156640279

     token = await create_installation_access_token (
          installation_id
     )


     return {
             "message": "Installation access token created successfully",
             "token_created": bool(token),
         }


@router.get("/test-repositories")
async def test_repositories():
     installation_id = 156640279

     data = await get_installation_repositories(
          installation_id
     )

     repositories = data.get("repositories", [])

     return {
          "total_count": data.get("total_count", 0),
        "repositories": [
            {
                "id": repo.get("id"),
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "private": repo.get("private"),
                "language": repo.get("language"),
                "default_branch": repo.get(
                    "default_branch"
                ),
                "html_url": repo.get("html_url"),  
     }

    for repo in repositories

        ],


     }

    