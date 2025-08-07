# scripts/add_tokens_table.py
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from config.database import Base
from config.settings import settings
from models.user import User
from models.token import TokenTable

async def create_tokens_table():
    """Create the tokens table"""
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        # Create the tokens table
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("✅ Tokens table created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tokens_table())
