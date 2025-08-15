# config/settings.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
    )
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # External API Configuration
    GOOGLE_BOOKS_API_KEY: str = os.getenv("GOOGLE_BOOKS_API_KEY")
    GOOGLE_BOOKS_URL: str = os.getenv("GOOGLE_BOOKS_URL", "https://www.googleapis.com/books/v1/volumes")
    
    # Environment Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:8081,http://localhost:3000,http://127.0.0.1:8081,http://127.0.0.1:3000"
    )

    class Config:
        env_file = "config/.env.production" if os.getenv("ENVIRONMENT") == "production" else "config/.env"
        case_sensitive = True

    @property
    def cors_origins(self) -> list[str]:
        """Convert ALLOWED_ORIGINS string to list"""
        if self.ENVIRONMENT == "production":
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        else:
            # Allow all origins in development
            return ["*"]

settings = Settings()
