#!/usr/bin/env python3
"""
Migration script to add avatar_seed column to users table
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import engine

async def run_migration():
    """Run the database migration"""
    
    try:
        async with engine.begin() as conn:
            print("🔄 Starting avatar column migration...")
            
            # Check if avatar_seed column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar_seed'
            """))
            
            avatar_seed_exists = result.fetchone() is not None
            
            if not avatar_seed_exists:
                print("🔄 Adding avatar_seed column to users table...")
                
                # Add avatar_seed column
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN avatar_seed VARCHAR
                """))
                
                print("✅ Avatar_seed column added successfully")
            else:
                print("🔄 Avatar_seed column already exists, skipping...")
            
            print("✅ Migration completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

async def rollback_migration():
    """Rollback the migration (for development purposes)"""
    
    try:
        async with engine.begin() as conn:
            print("🔄 Rolling back avatar column migration...")
            
            # Remove avatar_seed column
            await conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS avatar_seed"))
            
            print("✅ Rollback completed!")
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration for avatar functionality")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.rollback:
        print("⚠️  WARNING: This will remove avatar_seed column!")
        confirm = input("Are you sure you want to rollback? (yes/no): ")
        if confirm.lower() == 'yes':
            asyncio.run(rollback_migration())
        else:
            print("Rollback cancelled.")
    else:
        asyncio.run(run_migration())
