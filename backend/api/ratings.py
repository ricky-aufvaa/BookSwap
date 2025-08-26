# api/ratings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc
from typing import List
from uuid import UUID

from models.user import User
from models.rating import UserRating
from models.transaction import Transaction
from schemas.rating import RatingCreate, RatingOut
from config.database import get_db
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/ratings", tags=["ratings"])

@router.post("/", response_model=RatingOut, status_code=201)
async def create_rating(
    rating_data: RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a rating for another user after a transaction
    """
    # Verify the transaction exists and current user was part of it
    transaction_result = await db.execute(
        select(Transaction)
        .where(Transaction.id == rating_data.transaction_id)
        .options(selectinload(Transaction.owner), selectinload(Transaction.requester))
    )
    transaction = transaction_result.scalars().first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify current user was part of this transaction
    if current_user.id not in [transaction.owner_id, transaction.requester_id]:
        raise HTTPException(status_code=403, detail="You can only rate users from your own transactions")
    
    # Verify the rated user was the other party in the transaction
    if current_user.id == transaction.owner_id:
        if rating_data.rated_user_id != transaction.requester_id:
            raise HTTPException(status_code=400, detail="You can only rate the other party in the transaction")
    else:
        if rating_data.rated_user_id != transaction.owner_id:
            raise HTTPException(status_code=400, detail="You can only rate the other party in the transaction")
    
    # Check if rating already exists
    existing_rating_result = await db.execute(
        select(UserRating)
        .where(
            and_(
                UserRating.rater_id == current_user.id,
                UserRating.transaction_id == rating_data.transaction_id
            )
        )
    )
    existing_rating = existing_rating_result.scalars().first()
    
    if existing_rating:
        raise HTTPException(status_code=400, detail="You have already rated this transaction")
    
    # Verify transaction is completed
    if transaction.status != 'completed':
        raise HTTPException(status_code=400, detail="You can only rate completed transactions")
    
    # Create the rating
    rating = UserRating(
        rater_id=current_user.id,
        rated_user_id=rating_data.rated_user_id,
        transaction_id=rating_data.transaction_id,
        rating=rating_data.rating,
        review_text=rating_data.review_text,
        rating_type=rating_data.rating_type
    )
    
    db.add(rating)
    await db.commit()
    await db.refresh(rating)
    
    # Update the rated user's average rating and total ratings
    await update_user_rating_stats(rating_data.rated_user_id, db)
    
    return RatingOut(
        id=rating.id,
        rater_id=rating.rater_id,
        rated_user_id=rating.rated_user_id,
        transaction_id=rating.transaction_id,
        rating=rating.rating,
        review_text=rating.review_text,
        rating_type=rating.rating_type,
        created_at=rating.created_at,
        rater_username=current_user.username
    )

@router.get("/user/{user_id}", response_model=List[RatingOut])
async def get_user_ratings(
    user_id: UUID,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all ratings for a specific user
    """
    result = await db.execute(
        select(UserRating)
        .where(UserRating.rated_user_id == user_id)
        .options(selectinload(UserRating.rater))
        .order_by(desc(UserRating.created_at))
        .limit(limit)
    )
    
    ratings = result.scalars().all()
    
    return [
        RatingOut(
            id=rating.id,
            rater_id=rating.rater_id,
            rated_user_id=rating.rated_user_id,
            transaction_id=rating.transaction_id,
            rating=rating.rating,
            review_text=rating.review_text,
            rating_type=rating.rating_type,
            created_at=rating.created_at,
            rater_username=rating.rater.username if rating.rater else None
        )
        for rating in ratings
    ]

@router.get("/transaction/{transaction_id}", response_model=List[RatingOut])
async def get_transaction_ratings(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all ratings for a specific transaction
    """
    # Verify user has access to this transaction
    transaction_result = await db.execute(
        select(Transaction)
        .where(Transaction.id == transaction_id)
    )
    transaction = transaction_result.scalars().first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if current_user.id not in [transaction.owner_id, transaction.requester_id]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get ratings for this transaction
    result = await db.execute(
        select(UserRating)
        .where(UserRating.transaction_id == transaction_id)
        .options(selectinload(UserRating.rater))
        .order_by(desc(UserRating.created_at))
    )
    
    ratings = result.scalars().all()
    
    return [
        RatingOut(
            id=rating.id,
            rater_id=rating.rater_id,
            rated_user_id=rating.rated_user_id,
            transaction_id=rating.transaction_id,
            rating=rating.rating,
            review_text=rating.review_text,
            rating_type=rating.rating_type,
            created_at=rating.created_at,
            rater_username=rating.rater.username if rating.rater else None
        )
        for rating in ratings
    ]

@router.get("/pending", response_model=List[dict])
async def get_pending_ratings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get transactions that the current user can rate but hasn't rated yet
    """
    # Get completed transactions where current user was involved
    transactions_result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.status == 'completed',
                or_(
                    Transaction.owner_id == current_user.id,
                    Transaction.requester_id == current_user.id
                )
            )
        )
        .options(selectinload(Transaction.owner), selectinload(Transaction.requester), selectinload(Transaction.book))
    )
    
    transactions = transactions_result.scalars().all()
    
    # Filter out transactions that current user has already rated
    pending_ratings = []
    for transaction in transactions:
        # Check if current user has already rated this transaction
        existing_rating_result = await db.execute(
            select(UserRating)
            .where(
                and_(
                    UserRating.rater_id == current_user.id,
                    UserRating.transaction_id == transaction.id
                )
            )
        )
        existing_rating = existing_rating_result.scalars().first()
        
        if not existing_rating:
            # Determine who the other user is
            other_user = transaction.owner if transaction.requester_id == current_user.id else transaction.requester
            
            pending_ratings.append({
                "transaction_id": transaction.id,
                "other_user_id": other_user.id,
                "other_user_username": other_user.username,
                "book_title": transaction.book.title if transaction.book else "Unknown Book",
                "transaction_type": transaction.transaction_type,
                "completed_date": transaction.actual_return_date or transaction.updated_at,
                "rating_type": "borrower" if transaction.owner_id == current_user.id else "lender"
            })
    
    return pending_ratings

async def update_user_rating_stats(user_id: UUID, db: AsyncSession):
    """
    Update a user's rating statistics after a new rating is added
    """
    # Get all ratings for this user
    result = await db.execute(
        select(UserRating)
        .where(UserRating.rated_user_id == user_id)
    )
    ratings = result.scalars().all()
    
    if ratings:
        # Calculate new average
        total_rating = sum(rating.rating for rating in ratings)
        average_rating = total_rating / len(ratings)
        
        # Update user's rating stats
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalars().first()
        
        if user:
            user.average_rating = average_rating
            user.total_ratings = len(ratings)
            await db.commit()
