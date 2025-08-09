# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_BOOKS_API_KEY: str ="AIzaSyBX9ShEmKc1rMz_VF_mH-tTYPrJrpHdguU"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Welcome%40123456@localhost:5432/bookswap"
    SECRET_KEY: str = "Welcome@123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1
    GOOGLE_BOOKS_URL: str = "https://www.googleapis.com/books/v1/volumes"

    class Config:
        env_file = "config/.env"

settings = Settings()
