# scripts/migrate_books.py
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from config.database import get_db, engine
from models.book import Book
from models.user import User

async def migrate_books():
    """Add owner_username to existing books"""
    async with engine.begin() as conn:
        # First, add the column if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE books ADD COLUMN owner_username VARCHAR"))
            print("✅ Added owner_username column to books table")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("ℹ️ owner_username column already exists")
            else:
                print(f"❌ Error adding column: {e}")
                return

    # Now update existing books with usernames
    async for db in get_db():
        try:
            # Get all books without owner_username
            result = await db.execute(
                select(Book, User)
                .join(User, Book.owner_id == User.id)
                .where(Book.owner_username.is_(None))
            )
            
            books_users = result.all()
            
            if not books_users:
                print("ℹ️ No books need username migration")
                return
                
            print(f"📚 Updating {len(books_users)} books with owner usernames...")
            
            for book, user in books_users:
                book.owner_username = user.username
                
            await db.commit()
            print("✅ Successfully updated all books with owner usernames")
            
        except Exception as e:
            print(f"❌ Error updating books: {e}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(migrate_books())
