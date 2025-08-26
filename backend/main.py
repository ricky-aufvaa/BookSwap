# main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.auth import router as auth_router
from api.books import router as books_router
from api.chat import router as chat_router
from config.database import create_db_and_tables
from config.settings import settings

app = FastAPI(
    title="BookSwap API", 
    version="1.0",
    description="A platform for swapping books between users",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.cors_origins,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0"
    }

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to BookSwap API!",
        "version": "1.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "Documentation disabled in production"
    }

# Include routers
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(books_router, prefix="/api/v1", tags=["books"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])

# Trust & Safety System routers
from api.trust import router as trust_router
from api.ratings import router as ratings_router
from api.transactions import router as transactions_router

app.include_router(trust_router, prefix="/api/v1", tags=["trust"])
app.include_router(ratings_router, prefix="/api/v1", tags=["ratings"])
app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )











#models--------------------(db related)
