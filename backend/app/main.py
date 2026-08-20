from fastapi import FastAPI
from sqlalchemy import text
from app.database.connection import engine 
from app.routes.auth import router as auth_router

app = FastAPI(
    title="GitLoop",
    description="Backend API for GitLoop AI Codebase Intelligence Platform ",
    version="0.1.0",
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