#!/usr/bin/env python3
"""
Comprehensive database migration script for BookSwap.
This script handles both fresh installations and updates to existing databases.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from config.settings import settings
from config.database import Base

async def check_table_exists(conn, table_name):
    """Check if a table exists in the database"""
    result = await conn.execute(
        text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"),
        {"table_name": table_name}
    )
    return result.scalar()

async def check_column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    result = await conn.execute(
        text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = :table_name AND column_name = :column_name
            )
        """),
        {"table_name": table_name, "column_name": column_name}
    )
    return result.scalar()

async def migrate_users_table(conn):
    """Migrate users table - ensure city column is NOT NULL"""
    print("Checking users table...")
    
    users_exists = await check_table_exists(conn, "users")
    if not users_exists:
        print("  Users table doesn't exist, will be created fresh")
        return
    
    # Check if city column allows NULL
    result = await conn.execute(
        text("""
            SELECT is_nullable FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'city'
        """)
    )
    is_nullable = result.scalar()
    
    if is_nullable == 'YES':
        print("  Updating city column to NOT NULL...")
        # First, update any NULL cities to empty string
        await conn.execute(text("UPDATE users SET city = '' WHERE city IS NULL"))
        # Then alter the column to NOT NULL
        await conn.execute(text("ALTER TABLE users ALTER COLUMN city SET NOT NULL"))
        print("  ✅ City column updated to NOT NULL")
    else:
        print("  ✅ City column is already NOT NULL")

async def migrate_books_table(conn):
    """Migrate books table - add new columns if they don't exist"""
    print("Checking books table...")
    
    books_exists = await check_table_exists(conn, "books")
    if not books_exists:
        print("  Books table doesn't exist, will be created fresh")
        return
    
    # Check for isbn column
    isbn_exists = await check_column_exists(conn, "books", "isbn")
    if not isbn_exists:
        print("  Adding isbn column...")
        await conn.execute(text("ALTER TABLE books ADD COLUMN isbn VARCHAR"))
        print("  ✅ ISBN column added")
    
    # Check for description column
    description_exists = await check_column_exists(conn, "books", "description")
    if not description_exists:
        print("  Adding description column...")
        await conn.execute(text("ALTER TABLE books ADD COLUMN description TEXT"))
        print("  ✅ Description column added")

async def create_chat_tables(conn):
    """Create chat tables if they don't exist"""
    print("Checking chat tables...")
    
    # Import chat models to ensure they're registered
    from models.chat import ChatRoom, ChatMessage
    
    chat_rooms_exists = await check_table_exists(conn, "chat_rooms")
    chat_messages_exists = await check_table_exists(conn, "chat_messages")
    
    if not chat_rooms_exists or not chat_messages_exists:
        print("  Creating chat tables...")
        # Create only chat tables
        await conn.run_sync(lambda sync_conn: ChatRoom.__table__.create(sync_conn, checkfirst=True))
        await conn.run_sync(lambda sync_conn: ChatMessage.__table__.create(sync_conn, checkfirst=True))
        print("  ✅ Chat tables created")
    else:
        print("  ✅ Chat tables already exist")

async def run_full_migration():
    """Run the complete database migration"""
    print("BookSwap Database Migration")
    print("=" * 40)
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered with Base
            from models.user import User
            from models.book import Book
            from models.request import BookRequest
            from models.token import TokenTable
            from models.chat import ChatRoom, ChatMessage
            
            print("Starting database migration...")
            
            # Create all tables (this is safe - it won't recreate existing tables)
            print("Creating/updating base tables...")
            await conn.run_sync(Base.metadata.create_all)
            
            # Run specific migrations
            await migrate_users_table(conn)
            await migrate_books_table(conn)
            await create_chat_tables(conn)
            
            print("\n✅ Database migration completed successfully!")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()

async def verify_database():
    """Verify the database structure"""
    print("\nVerifying database structure...")
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    try:
        async with engine.begin() as conn:
            # Check all required tables
            tables_to_check = ["users", "books", "book_requests", "tokens", "chat_rooms", "chat_messages"]
            
            for table in tables_to_check:
                exists = await check_table_exists(conn, table)
                status = "✅" if exists else "❌"
                print(f"  {status} {table}")
                
                if not exists:
                    print(f"    ❌ Table {table} is missing!")
                    return False
            
            # Check specific columns
            print("\nChecking critical columns...")
            
            # Users table
            city_not_null = await conn.execute(
                text("""
                    SELECT is_nullable FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'city'
                """)
            )
            city_nullable = city_not_null.scalar()
            print(f"  {'✅' if city_nullable == 'NO' else '❌'} users.city NOT NULL: {city_nullable == 'NO'}")
            
            # Books table optional columns
            isbn_exists = await check_column_exists(conn, "books", "isbn")
            desc_exists = await check_column_exists(conn, "books", "description")
            print(f"  {'✅' if isbn_exists else '⚠️ '} books.isbn exists: {isbn_exists}")
            print(f"  {'✅' if desc_exists else '⚠️ '} books.description exists: {desc_exists}")
            
            print("\n🎉 Database verification completed!")
            return True
            
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        return False
    finally:
        await engine.dispose()

async def main():
    """Main migration function"""
    try:
        await run_full_migration()
        success = await verify_database()
        
        if success:
            print("\n🚀 Your BookSwap database is ready!")
            print("\nNext steps:")
            print("1. Start your backend: docker-compose up backend")
            print("2. Start your mobile app: cd BookSwapMobile && npm start")
        else:
            print("\n⚠️  Database verification found issues. Please check the logs above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
