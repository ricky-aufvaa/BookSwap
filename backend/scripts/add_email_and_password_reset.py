#!/usr/bin/env python3
"""
Migration script to add email column to users table and create password_resets table
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import engine, Base
from models.user import User
from models.password_reset import PasswordReset

async def run_migration():
    """Run the database migration"""
    
    try:
        async with engine.begin() as conn:
            print("🔄 Starting migration...")
            
            # Check if email column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'email'
            """))
            
            email_exists = result.fetchone() is not None
            
            if not email_exists:
                print("📧 Adding email column to users table...")
                # Add email column (nullable initially for existing users)
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email VARCHAR
                """))
                
                # Add unique index on email (will be enforced after data migration)
                print("🔍 Adding email index...")
                await conn.execute(text("""
                    CREATE INDEX idx_users_email ON users(email)
                """))
                
                print("✅ Email column added successfully")
            else:
                print("📧 Email column already exists, skipping...")
            
            # Check if password_resets table exists
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'password_resets'
            """))
            
            table_exists = result.fetchone() is not None
            
            if not table_exists:
                print("🔑 Creating password_resets table...")
                # Create password_resets table using SQLAlchemy
                await conn.run_sync(Base.metadata.create_all, tables=[PasswordReset.__table__])
                print("✅ Password resets table created successfully")
            else:
                print("🔑 Password resets table already exists, skipping...")
            
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
            print("🔄 Rolling back migration...")
            
            # Drop password_resets table
            await conn.execute(text("DROP TABLE IF EXISTS password_resets CASCADE"))
            print("🗑️ Dropped password_resets table")
            
            # Remove email column (be careful with this in production!)
            await conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS email"))
            print("🗑️ Removed email column from users table")
            
            print("✅ Rollback completed!")
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration for email and password reset")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.rollback:
        print("⚠️  WARNING: This will remove the email column and password_resets table!")
        confirm = input("Are you sure you want to rollback? (yes/no): ")
        if confirm.lower() == 'yes':
            asyncio.run(rollback_migration())
        else:
            print("Rollback cancelled.")
    else:
        asyncio.run(run_migration())
