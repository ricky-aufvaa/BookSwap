#!/usr/bin/env python3
"""
Migration script to add thumbnail column to books table
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import engine

async def add_thumbnail_column():
    """Add thumbnail column to books table if it doesn't exist"""
    try:
        async with engine.begin() as conn:
            # Check if thumbnail column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'thumbnail'
            """))
            
            if result.fetchone() is None:
                print("Adding thumbnail column to books table...")
                await conn.execute(text("""
                    ALTER TABLE books 
                    ADD COLUMN thumbnail VARCHAR NULL
                """))
                print("✅ Successfully added thumbnail column to books table")
            else:
                print("✅ Thumbnail column already exists in books table")
                
    except Exception as e:
        print(f"❌ Error adding thumbnail column: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("🔄 Starting thumbnail column migration...")
    asyncio.run(add_thumbnail_column())
    print("✅ Migration completed!")
