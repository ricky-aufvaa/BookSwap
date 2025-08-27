#!/usr/bin/env python3
"""
Script to normalize existing city names to lowercase in the database
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from config.database import get_async_session
from models.user import User

async def normalize_cities():
    """
    Convert all existing city names to lowercase
    """
    print("🔄 Starting city normalization...")
    
    async with get_async_session() as db:
        try:
            # Get all users with cities
            result = await db.execute(
                select(User).where(User.city.isnot(None))
            )
            users = result.scalars().all()
            
            print(f"📊 Found {len(users)} users with city information")
            
            updated_count = 0
            for user in users:
                if user.city:
                    original_city = user.city
                    normalized_city = user.city.lower().strip()
                    
                    if original_city != normalized_city:
                        print(f"🔄 Normalizing: '{original_city}' -> '{normalized_city}' for user {user.username}")
                        user.city = normalized_city
                        db.add(user)
                        updated_count += 1
                    else:
                        print(f"✅ Already normalized: '{original_city}' for user {user.username}")
            
            if updated_count > 0:
                await db.commit()
                print(f"✅ Successfully normalized {updated_count} city names")
            else:
                print("✅ All city names were already normalized")
                
        except Exception as e:
            print(f"❌ Error during city normalization: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    print("🚀 City Normalization Script")
    print("=" * 50)
    
    try:
        asyncio.run(normalize_cities())
        print("=" * 50)
        print("✅ City normalization completed successfully!")
    except Exception as e:
        print("=" * 50)
        print(f"❌ City normalization failed: {str(e)}")
        sys.exit(1)
