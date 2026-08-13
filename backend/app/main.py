from fastapi import FastAPI

app = FastAPI(
    title="GitLoop",
    description="Backend API for GitLoop AI Codebase Intelligence Platform ",
    version="0.1.0",
)

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