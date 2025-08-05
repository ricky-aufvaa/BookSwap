# api/requests.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.request import BookRequest
from models.book import Book
from models.user import User
from schemas.request import RequestCreate, RequestOut
from config.database import get_db
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("/", response_model=RequestOut, status_code=201)
async def request_book(request: RequestCreate, db: AsyncSession = Depends(get_db), current_user: str = Depends(get_current_user)):
    result = await db.execute(select(User).where(User.username == current_user.username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")

    db_request = BookRequest(user_id=user.id, book_title=request.book_title )
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)

    # City-based matching
    owners_result = await db.execute(
        select(User)
        .join(Book)
        .where(Book.title.ilike(request.book_title), User.city == user.city)
    )
    owners = owners_result.scalars().all()

    my_books_result = await db.execute(select(Book).where(Book.owner_id == user.id))
    my_books = my_books_result.scalars().all()
    my_book_titles = {book.title.lower() for book in my_books}

    matches = []
    for owner in owners:
        wanted_result = await db.execute(select(BookRequest).where(BookRequest.user_id == owner.id))
        wanted_titles = {req.book_title.lower() for req in wanted_result.scalars().all()}
        if my_book_titles & wanted_titles:
            matches.append({
                "matched_with": owner.username,
                "has_your_book": request.book_title,
                "wants_your_book": (my_book_titles & wanted_titles).pop()
            })

    if matches:
        print("🎯 Matches found:", matches)
    else:
        print("📭 No matches yet.")

    return db_request
    # return {
    #     "id": db_request.id,
    #     "book_title": db_request.book_title,
    #     "user_id": db_request.user_id,
    #     "username": user.username,           # ← Include username
    #     "created_at": db_request.created_at
    # }