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
   