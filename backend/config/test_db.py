"""
Database connection testing utility for BookSwap application.
This module provides functions to test database connectivity and perform basic operations.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text

# Import existing database configuration
from config.database import engine, get_db, AsyncSessionLocal
from config.settings import settings

# Import models for testing
from models.user import User
from models.book import Book
from models.request import BookRequest
from models.chat import ChatRoom, ChatMessage
from models.token import TokenTable


async def test_basic_connection():
    """Test basic database connection with a simple query."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 AS health"))
            print("✅ Database connection successful!")
            print(f"Query result: {result.scalar()}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False


async def test_database_tables():
    """Test if all required tables exist in the database."""
    try:
        async with AsyncSessionLocal() as session:
            # Test each table by attempting to query it
            tables_to_test = [
                ("users", User),
                ("books", Book),
                ("book_requests", BookRequest),
                ("chat_rooms", ChatRoom),
                ("chat_messages", ChatMessage)
            ]
            
            for table_name, model in tables_to_test:
                try:
                    result = await session.execute(select(model).limit(1))
                    print(f"✅ Table '{table_name}' exists and is accessible")
                except Exception as table_error:
                    print(f"❌ Table '{table_name}' error: {str(table_error)}")
            
            return True
    except Exception as e:
        print(f"❌ Table testing failed: {str(e)}")
        return False


async def test_user_operations():
    """Test basic user operations and show detailed user information with their books."""
    try:
        async with AsyncSessionLocal() as session:
            # Get all users with their books
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"✅ Found {len(users)} users in database")
            print("\n" + "="*80)
            print("📋 DETAILED USER INFORMATION:")
            print("="*80)
            
            for i, user in enumerate(users, 1):
                print(f"\n👤 User {i}: {user.username}")
                print(f"   🏙️  City: {user.city}")
                print(f"   📅 Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'N/A'}")
                
                # Get books owned by this user
                books_result = await session.execute(
                    select(Book).where(Book.owner_id == user.id)
                )
                user_books = books_result.scalars().all()
                
                if user_books:
                    print(f"   📚 Books owned ({len(user_books)}):")
                    for j, book in enumerate(user_books, 1):
                        print(f"      {j}. '{book.title}' by {book.author}")
                        print(f"         📅 Added: {book.created_at.strftime('%Y-%m-%d %H:%M:%S') if book.created_at else 'N/A'}")
                else:
                    print(f"   📚 Books owned: None")
                
                print("-" * 60)
            
            return True
    except Exception as e:
        print(f"❌ User operations test failed: {str(e)}")
        return False


async def test_book_operations():
    """Test basic book operations."""
    try:
        async with AsyncSessionLocal() as session:
            # Count existing books
            result = await session.execute(select(Book))
            books = result.scalars().all()
            print(f"✅ Found {len(books)} books in database")
            
            # Display first few books
            for i, book in enumerate(books[:3]):
                print(f"  Book {i+1}: {book.title} by {book.author}")
            
            return True
    except Exception as e:
        print(f"❌ Book operations test failed: {str(e)}")
        return False


async def run_all_tests():
    """Run all database tests."""
    print("🔍 Starting database tests...")
    print(f"📊 Using database: {settings.DATABASE_URL}")
    print("-" * 50)
    
    tests = [
        ("Basic Connection", test_basic_connection),
        ("Table Structure", test_database_tables),
        ("User Operations", test_user_operations),
        ("Book Operations", test_book_operations)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} test...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Database is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
