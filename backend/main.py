"""
ASTRAEA - Professional Astrology Web Platform
FastAPI Backend Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="ASTRAEA API",
    description="Professional Astrology Chart Calculation and AI Interpretation",
    version="1.0.0",
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routers import charts, interpret

# Register routers
app.include_router(charts.router, prefix="/api/charts", tags=["Charts"])
app.include_router(interpret.router, prefix="/api", tags=["Interpretation"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ASTRAEA Astrology API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "immanuel": "available",
        "openrouter": "configured" if os.getenv("OPENROUTER_API_KEY") else "not_configured"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true"
    )
