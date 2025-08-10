#!/usr/bin/env python3
"""
Migration script to add chat functionality to the BookSwap database.
This script creates the chat_rooms and chat_messages tables.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from config.settings import settings
from config.database import Base

async def migrate_chat_tables():
    """Create chat tables in the database"""
    print("Starting chat tables migration...")
    
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    try:
        # Import all models to ensure they're registered with Base
        from models.user import User
        from models.book import Book
        from models.request import BookRequest
        from models.token import TokenTable
        from models.chat import ChatRoom, ChatMessage
        
        print("Creating chat tables...")
        
        async with engine.begin() as conn:
            # Create only the new chat tables
            await conn.run_sync(Base.metadata.create_all)
            
        print("✅ Chat tables created successfully!")
        print("New tables:")
        print("  - chat_rooms")
        print("  - chat_messages")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        await engine.dispose()

async def verify_tables():
    """Verify that the chat tables were created"""
    print("\nVerifying chat tables...")
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    try:
        async with engine.begin() as conn:
            # Check if chat_rooms table exists
            result = await conn.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_rooms')"
            )
            chat_rooms_exists = result.scalar()
            
            # Check if chat_messages table exists
            result = await conn.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages')"
            )
            chat_messages_exists = result.scalar()
            
            if chat_rooms_exists and chat_messages_exists:
                print("✅ All chat tables verified successfully!")
                
                # Get table info
                result = await conn.execute(
                    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_rooms' ORDER BY ordinal_position"
                )
                chat_rooms_columns = result.fetchall()
                
                result = await conn.execute(
                    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_messages' ORDER BY ordinal_position"
                )
                chat_messages_columns = result.fetchall()
                
                print("\nchat_rooms columns:")
                for col_name, col_type in chat_rooms_columns:
                    print(f"  - {col_name}: {col_type}")
                
                print("\nchat_messages columns:")
                for col_name, col_type in chat_messages_columns:
                    print(f"  - {col_name}: {col_type}")
                    
            else:
                print("❌ Some chat tables are missing!")
                print(f"chat_rooms exists: {chat_rooms_exists}")
                print(f"chat_messages exists: {chat_messages_exists}")
                
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        raise
    finally:
        await engine.dispose()

async def main():
    """Main migration function"""
    print("BookSwap Chat Migration Script")
    print("=" * 40)
    
    try:
        await migrate_chat_tables()
        await verify_tables()
        print("\n🎉 Chat migration completed successfully!")
        print("\nYou can now use the chat functionality in your BookSwap app.")
        
    except Exception as e:
        print(f"\n💥 Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
