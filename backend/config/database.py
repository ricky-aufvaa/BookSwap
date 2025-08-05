# config/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import text
from config.settings import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    print("hi")
    async with AsyncSessionLocal() as session:
        print(session)
        yield session

async def create_db_and_tables():
    async with engine.begin() as conn:
        from models.user import User
        from models.book import Book
        from models.request import BookRequest
        await conn.run_sync(Base.metadata.create_all)