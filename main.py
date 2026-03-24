from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import transactions, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BizPulse API",
    description="Backend REST API for BizPulse SME Financial Dashboard with Secure Auth",
    version="2.0.0"
)

# Setup CORS to allow the frontend to interact with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Secure BizPulse API."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
