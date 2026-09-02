from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine, Base
from app.routes.auth import router as auth_router

from app.models.user import User
from app.models.session import Session
from app.models.github_installation import GitHubInstallation

from app.github_app import (
    router as github_app_router,
    api_router as github_api_router,
)


# ============================================================
# DATABASE
# ============================================================

# Create missing tables
Base.metadata.create_all(bind=engine)


# Keep existing databases compatible with nullable User.email
with engine.begin() as connection:
    connection.execute(
        text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL")
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="GitLoop",
    description="Backend API for GitLoop AI Codebase Intelligence Platform",
    version="0.1.0",
)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# ROUTERS
# ============================================================

# Authentication routes
app.include_router(auth_router)


# GitHub App setup/testing routes
#
# These remain under:
# /github/app/...
#
app.include_router(github_app_router)


# Real GitHub API routes
#
# These will be under:
# /api/github/...
#
app.include_router(
    github_api_router,
    prefix="/api/github",
)


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "message": "GitLoop API is running",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {
        "status": "GitLoop API is healthy",
        "service": "GitLoop Backend",
    }


@app.get("/api/db-test")
def db_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "result": result.scalar(),
        }