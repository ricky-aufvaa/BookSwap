#!/usr/bin/env python3
"""
Startup script for BookSwap API on Render
"""
import os
import uvicorn
from config.settings import settings

if __name__ == "__main__":
    # Set environment to production if not already set
    if not os.getenv("ENVIRONMENT"):
        os.environ["ENVIRONMENT"] = "production"
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,  # Disable reload in production
        access_log=True,
        log_level="info" if settings.ENVIRONMENT == "production" else "debug"
    )
