import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine, Base

from app.models.user import User
from app.models.session import Session
from app.models.github_installation import GitHubInstallation
from app.models.repository_index import RepositoryIndex
from app.models.repository_file import RepositoryFile

from app.routes.auth import router as auth_router
from app.github_app import (
    router as github_app_router,
    api_router as github_api_router,
)
from app.routes.repository_indexing import router as repository_indexing_router
from app.routes.repository_codebase import router as repository_codebase_router
from app.routes.file_intelligence import router as file_intelligence_router
from app.routes.repository_architecture import router as repository_architecture_router
from app.routes.repository_ai_chat import router as repository_ai_chat_router


Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE users "
            "ALTER COLUMN email DROP NOT NULL"
        )
    )


app = FastAPI(
    title="GitLoop",
    description=(
        "Backend API for GitLoop AI Codebase "
        "Intelligence Platform"
    ),
    version="0.1.0",
)


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(github_app_router)
app.include_router(github_api_router, prefix="/api/github")
app.include_router(repository_indexing_router, prefix="/api/github")
app.include_router(repository_codebase_router, prefix="/api/github")
app.include_router(file_intelligence_router, prefix="/api/github")
app.include_router(repository_architecture_router, prefix="/api/github")
app.include_router(repository_ai_chat_router, prefix="/api/github")


@app.get("/")
def root():
    return {"message": "GitLoop backend is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/db-test")
def db_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {"database": "connected", "result": value}