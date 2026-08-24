from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import engine, Base
from app.routes.auth import router as auth_router
from app.models.user import User
from app.models.session import Session
from fastapi.middleware.cors import CORSMiddleware 

Base.metadata.create_all(bind=engine)

# `create_all` only creates missing tables; it does not update an existing
# table.  Keep databases created before `User.email` became optional in sync
# with the model so GitHub users without a public email can sign in.
with engine.begin() as connection:
    connection.execute(
        text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL")
    )

app = FastAPI(
    title="GitLoop",
    description="Backend API for GitLoop AI Codebase Intelligence Platform ",
    version="0.1.0",
)

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

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "GitLoop API is running",
            "status": "ok",
            }

@app.get("/health")
def health():   
    return {"status": "GitLoop API is healthy",
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
