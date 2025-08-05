# api/books.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.book import Book
from models.user import User
from schemas.book import BookOut, BookCreate
from config.database import get_db
from utils.auth_utils import get_current_user
from utils.google_books import search_google_books

router = APIRouter(prefix="/books", tags=["books"])

@router.post("/", response_model=BookOut, status_code=201)
async def add_book(book: BookCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    print("current user hai ---",current_user.username)
    print("user hai ---",User.username)
    result = await db.execute(select(User).where(User.username.ilike(current_user.username)))
    # result = await db.execute(select(User).where(User.username.ilike(current_user)))
    print("result")
    user = result.scalars().first()
    if not user:
        if not user:
            print("❌ User not found in DB")
        raise HTTPException(404, "User not found")

    db_book = Book(title=book.title, author=book.author, owner_id=current_user.id)
    print("hi")
    db.add(db_book)
    await db.commit()
    await db.refresh(db_book)
    return db_book

@router.get("/", response_model=list[BookOut])
async def get_my_books(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Book).where(Book.owner_id == current_user.id))
    return result.scalars().all()

@router.get("/search", response_model=list)
async def search_books(query: str, db: AsyncSession = Depends(get_db), current_user: str = Depends(get_current_user)):
    if not query.strip():
        return []

    google_books = await search_google_books(query)

    result = await db.execute(select(User).where(User.username == current_user.username))
    user = result.scalars().first()
    if not user or not user.city:
        return google_books

    city_users = await db.execute(select(User.id).where(User.city == user.city, User.username != current_user.username))
    city_user_ids = [u.id for u in city_users.scalars().all()]
    if not city_user_ids:
        return google_books

    city_books = await db.execute(select(Book).where(Book.owner_id.in_(city_user_ids)))
    city_book_titles = {b.title.lower() for b in city_books.scalars().all()}

    for book in google_books:
        title_lower = book["title"].lower()
        book["available_in_city"] = title_lower in city_book_titles
        book["local_owners_count"] = sum(1 for b in city_books.scalars().all() if b.title.lower() == title_lower)

    return google_books


# api/books.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.book import Book
from models.user import User
from schemas.user import UserOut
from config.database import get_db
from utils.auth_utils import get_current_user

# router = APIRouter(prefix="/books", tags=["books"])

# # ... existing routes: /, /search, etc. ...

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