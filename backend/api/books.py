# api/books.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.book import Book
from models.user import User
from schemas.book import BookOut, BookCreate
from schemas.user import UserOut
from config.database import get_db
from utils.auth_utils import get_current_user
from utils.google_books import search_google_books

router = APIRouter(prefix="/books", tags=["books"])

@router.post("/", response_model=BookOut, status_code=201)
async def add_book(book: BookCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_book = Book(
        title=book.title, 
        author=book.author, 
        owner_id=current_user.id, 
        owner_username=current_user.username
    )
    db.add(db_book)
    await db.commit()
    await db.refresh(db_book)
    return db_book

@router.get("/", response_model=list[BookOut])
async def get_my_books(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        print(f"Getting books for user: {current_user.username} (ID: {current_user.id})")
        result = await db.execute(select(Book).where(Book.owner_id == current_user.id))
        books = result.scalars().all()
        #update 24 august
        for book in books:
            search_books(book)
        print(f"Found {len(books)} books for user {current_user.username}")
        return books
    except Exception as e:
        print(f"Error in get_my_books: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch books: {str(e)}")

@router.get("/search", response_model=list)
async def search_books(query: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not query.strip():
        return []

    google_books = await search_google_books(query)

    # Check if current user has a city
    if not current_user.city:
        print(f"Current user {current_user.username} has no city set")
        return google_books

    print(f"Searching for users in city: {current_user.city}")
    
    # Get users in the same city (excluding current user)
    city_users_result = await db.execute(
        select(User).where(
            User.city == current_user.city, 
            User.username != current_user.username
        )
    )
    city_users = city_users_result.scalars().all()
    print(f"Found {len(city_users)} users in city {current_user.city}")
    
    if not city_users:
        print(f"No other users found in city {current_user.city}")
        return google_books
    
    # Extract user IDs
    city_user_ids = [user.id for user in city_users]
    print(f"City user IDs: {city_user_ids}")

    # Get books owned by users in the same city
    city_books_result = await db.execute(select(Book).where(Book.owner_id.in_(city_user_ids)))
    city_books = city_books_result.scalars().all()
    print(f"Found {len(city_books)} books owned by users in {current_user.city}")
    
    # Create a set of book titles (lowercase for case-insensitive matching)
    city_book_titles = {book.title.lower() for book in city_books}
    print(f"Available book titles in city: {city_book_titles}")

    # Add availability information to Google Books results
    for book in google_books:
        title_lower = book["title"].lower()
        book["available_in_city"] = title_lower in city_book_titles
        book["local_owners_count"] = sum(1 for city_book in city_books if city_book.title.lower() == title_lower)
        print(f"Book '{book['title']}' - Available in city: {book['available_in_city']}, Local owners: {book['local_owners_count']}")

    return google_books

@router.get("/search-owners", response_model=list[UserOut])
async def search_book_owners(
    book_title: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find all users in my city who own the given book
    """
    if not book_title.strip():
        return []

    # Find users in the same city who own the book
    result = await db.execute(
        select(User)
        .join(Book)
        .where(
            Book.title.ilike(book_title),
            User.city == current_user.city,
            User.id != current_user.id  # Exclude self
        )
    )
    owners = result.scalars().all()

    if not owners:
        raise HTTPException(
            status_code=404,
            detail=f"No users in {current_user.city} own '{book_title}'"
        )

    return owners
