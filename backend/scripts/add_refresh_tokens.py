#!/usr/bin/env python3
"""
Migration script to add refresh token columns to tokens table
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
            print("🔄 Starting refresh token migration...")
            
            # Check if refresh_token column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tokens' AND column_name = 'refresh_token'
            """))
            
            refresh_token_exists = result.fetchone() is not None
            
            if not refresh_token_exists:
                print("🔄 Adding refresh token columns to tokens table...")
                
                # Add refresh token column
                await conn.execute(text("""
                    ALTER TABLE tokens 
                    ADD COLUMN refresh_token VARCHAR
                """))
                
                # Add access token expiry column
                await conn.execute(text("""
                    ALTER TABLE tokens 
                    ADD COLUMN access_token_expires TIMESTAMP WITHOUT TIME ZONE
                """))
                
                # Add refresh token expiry column
                await conn.execute(text("""
                    ALTER TABLE tokens 
                    ADD COLUMN refresh_token_expires TIMESTAMP WITHOUT TIME ZONE
                """))
                
                print("✅ Refresh token columns added successfully")
            else:
                print("🔄 Refresh token columns already exist, skipping...")
            
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
            print("🔄 Rolling back refresh token migration...")
            
            # Remove refresh token columns
            await conn.execute(text("ALTER TABLE tokens DROP COLUMN IF EXISTS refresh_token"))
            await conn.execute(text("ALTER TABLE tokens DROP COLUMN IF EXISTS access_token_expires"))
            await conn.execute(text("ALTER TABLE tokens DROP COLUMN IF EXISTS refresh_token_expires"))
            
            print("✅ Rollback completed!")
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration for refresh tokens")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.rollback:
        print("⚠️  WARNING: This will remove refresh token columns!")
        confirm = input("Are you sure you want to rollback? (yes/no): ")
        if confirm.lower() == 'yes':
            asyncio.run(rollback_migration())
        else:
            print("Rollback cancelled.")
    else:
        asyncio.run(run_migration())
