from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine, Base

from app.routes.auth import router as auth_router

from app.models.user import User
from app.models.session import Session
from app.models.github_installation import GitHubInstallation
from app.models.repository_index import RepositoryIndex
from app.models.repository_file import RepositoryFile

from app.github_app import (
    router as github_app_router,
    api_router as github_api_router,
)

from app.routes.repository_indexing import (
    router as repository_indexing_router,
)


# ---------------------------------------------------------
# Create database tables
# ---------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# Existing database fix
# ---------------------------------------------------------

with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE users "
            "ALTER COLUMN email DROP NOT NULL"
        )
    )


# ---------------------------------------------------------
# Create FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="GitLoop",
    description=(
        "Backend API for GitLoop AI Codebase "
        "Intelligence Platform"
    ),
    version="0.1.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

# Authentication
app.include_router(auth_router)


# GitHub App setup
app.include_router(github_app_router)


# GitHub APIs
app.include_router(
    github_api_router,
    prefix="/api/github",
)


# Repository indexing
app.include_router(
    repository_indexing_router,
    prefix="/api/github",
)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "GitLoop backend is running"
    }


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# Database test
# ---------------------------------------------------------

@app.get("/api/db-test")
def db_test():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

        value = result.scalar()

    return {
        "database": "connected",
        "result": value,
    }

from app.routes.repository_codebase import (
    router as repository_codebase_router,
)

app.include_router(repository_codebase_router, prefix="/api/github")

app.include_router(repository_indexing_router, prefix="/api/github")

