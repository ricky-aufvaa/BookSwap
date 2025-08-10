# config/settings.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_BOOKS_API_KEY: str = "AIzaSyBX9ShEmKc1rMz_VF_mH-tTYPrJrpHdguU"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Welcome%40123456@localhost:5432/bookswap"
    SECRET_KEY: str = "Welcome@123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GOOGLE_BOOKS_URL: str = "https://www.googleapis.com/books/v1/volumes"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = "config/.env.production" if os.getenv("ENVIRONMENT") == "production" else "config/.env"

settings = Settings()
