# api/books.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.book import Book
from models.user import User
from schemas.book import BookOut, BookCreate, BookUpdate
from schemas.user import UserOut
from config.database import get_db
from utils.auth_utils import get_current_user
from utils.google_books import search_google_books

router = APIRouter(prefix="/books", tags=["books"])

@router.post("/", response_model=BookOut, status_code=201)
async def add_book(book: BookCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Search for thumbnail from Google Books API
    thumbnail_url = None
    try:
        google_books = await search_google_books(book.title, max_results=1)
        if google_books and len(google_books) > 0:
            thumbnail_url = google_books[0].get("thumbnail")
            print(f"Found thumbnail for '{book.title}': {thumbnail_url}")
    except Exception as e:
        print(f"Failed to fetch thumbnail for '{book.title}': {str(e)}")
    
    db_book = Book(
        title=book.title, 
        author=book.author, 
        owner_id=current_user.id, 
        owner_username=current_user.username,
        thumbnail=thumbnail_url
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
        
        # For existing books without thumbnails, fetch and update them
        for book in books:
            if not book.thumbnail:
                try:
                    google_books = await search_google_books(book.title, max_results=1)
                    if google_books and len(google_books) > 0:
                        thumbnail_url = google_books[0].get("thumbnail")
                        if thumbnail_url:
                            book.thumbnail = thumbnail_url
                            db.add(book)  # Mark for update
                            print(f"Updated thumbnail for existing book '{book.title}': {thumbnail_url}")
                except Exception as e:
                    print(f"Failed to fetch thumbnail for existing book '{book.title}': {str(e)}")
        
        # Commit any thumbnail updates
        await db.commit()
        
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

@router.put("/{book_id}", response_model=BookOut)
async def update_book(
    book_id: str,
    book_update: BookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a book owned by the current user
    """
    try:
        # Find the book and verify ownership
        result = await db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.owner_id == current_user.id
            )
        )
        book = result.scalar_one_or_none()
        
        if not book:
            raise HTTPException(
                status_code=404,
                detail="Book not found or you don't have permission to edit it"
            )
        
        # Update fields if provided
        update_data = book_update.dict(exclude_unset=True)
        
        # If title is being updated, try to fetch new thumbnail
        if 'title' in update_data:
            try:
                google_books = await search_google_books(update_data['title'], max_results=1)
                if google_books and len(google_books) > 0:
                    thumbnail_url = google_books[0].get("thumbnail")
                    if thumbnail_url:
                        update_data['thumbnail'] = thumbnail_url
                        print(f"Updated thumbnail for book '{update_data['title']}': {thumbnail_url}")
            except Exception as e:
                print(f"Failed to fetch thumbnail for updated book '{update_data['title']}': {str(e)}")
        
        # Apply updates
        for field, value in update_data.items():
            setattr(book, field, value)
        
        await db.commit()
        await db.refresh(book)
        
        print(f"Updated book {book_id} for user {current_user.username}")
        return book
        
    except Exception as e:
        print(f"Error updating book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update book: {str(e)}")

@router.delete("/{book_id}")
async def delete_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a book owned by the current user
    """
    try:
        # Find the book and verify ownership
        result = await db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.owner_id == current_user.id
            )
        )
        book = result.scalar_one_or_none()
        
        if not book:
            raise HTTPException(
                status_code=404,
                detail="Book not found or you don't have permission to delete it"
            )
        
        book_title = book.title
        # Use the session to delete the book
        await db.delete(book)
        await db.commit()
        
        print(f"Deleted book '{book_title}' (ID: {book_id}) for user {current_user.username}")
        return {"message": f"Book '{book_title}' deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete book: {str(e)}")
