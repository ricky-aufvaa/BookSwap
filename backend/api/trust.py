# api/trust.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from uuid import UUID

from models.user import User
from models.rating import UserRating, TrustBadge
from models.transaction import Transaction
from schemas.rating import TrustProfileOut, UserTrustSummary, TrustBadgeOut, RatingOut
from config.database import get_db
from utils.auth_utils import get_current_user
from utils.trust_calculator import calculate_trust_score, determine_badges_to_award, get_trust_level_info, get_badge_info

router = APIRouter(prefix="/trust", tags=["trust"])

@router.get("/profile/{user_id}", response_model=TrustProfileOut)
async def get_trust_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete trust profile for a user
    """
    # Get user with trust data
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.trust_badges), selectinload(User.ratings_received))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent ratings (last 10)
    ratings_result = await db.execute(
        select(UserRating)
        .where(UserRating.rated_user_id == user_id)
        .options(selectinload(UserRating.rater))
        .order_by(desc(UserRating.created_at))
        .limit(10)
    )
    recent_ratings = ratings_result.scalars().all()
    
    # Format recent ratings
    formatted_ratings = [
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
        for rating in recent_ratings
    ]
    
    # Format badges
    formatted_badges = [
        TrustBadgeOut(
            id=badge.id,
            badge_type=badge.badge_type,
            earned_date=badge.earned_date,
            is_active=badge.is_active
        )
        for badge in user.trust_badges if badge.is_active
    ]
    
    return TrustProfileOut(
        user_id=user.id,
        username=user.username,
        average_rating=float(user.average_rating) if user.average_rating else 0.0,
        total_ratings=user.total_ratings or 0,
        total_transactions=user.total_transactions or 0,
        successful_transactions=user.successful_transactions or 0,
        late_returns=user.late_returns or 0,
        trust_score=float(user.trust_score) if user.trust_score else 100.0,
        trust_level=user.trust_level,
        is_profile_hidden=user.is_profile_hidden or False,
        badges=formatted_badges,
        recent_ratings=formatted_ratings
    )

@router.get("/summary/{user_id}", response_model=UserTrustSummary)
async def get_trust_summary(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get lightweight trust summary for displaying in lists
    """
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.trust_badges))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get active badge types
    active_badges = [badge.badge_type for badge in user.trust_badges if badge.is_active]
    
    return UserTrustSummary(
        user_id=user.id,
        username=user.username,
        average_rating=float(user.average_rating) if user.average_rating else 0.0,
        total_ratings=user.total_ratings or 0,
        trust_score=float(user.trust_score) if user.trust_score else 100.0,
        trust_level=user.trust_level,
        badges=active_badges
    )

@router.get("/badge-info/{badge_type}")
async def get_badge_info_endpoint(badge_type: str):
    """
    Get display information for a specific badge type
    """
    badge_info = get_badge_info(badge_type)
    return badge_info

@router.get("/trust-level-info/{trust_score}")
async def get_trust_level_info_endpoint(trust_score: float):
    """
    Get trust level information for a given trust score
    """
    trust_info = get_trust_level_info(trust_score)
    return trust_info

@router.post("/update-trust-score/{user_id}")
async def update_user_trust_score(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recalculate and update a user's trust score and badges
    (This would typically be called automatically after transactions/ratings)
    """
    # Only allow admins or the user themselves to trigger this
    if current_user.id != user_id:
        # In a real app, you'd check for admin privileges here
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's ratings and transactions for calculation
    ratings_result = await db.execute(
        select(UserRating).where(UserRating.rated_user_id == user_id)
    )
    ratings = ratings_result.scalars().all()
    
    transactions_result = await db.execute(
        select(Transaction).where(
            or_(Transaction.owner_id == user_id, Transaction.requester_id == user_id)
        )
    )
    transactions = transactions_result.scalars().all()
    
    # Calculate new trust score
    user_data = {
        'average_rating': float(user.average_rating) if user.average_rating else 0.0,
        'total_ratings': len(ratings),
        'total_transactions': len(transactions),
        'successful_transactions': len([t for t in transactions if t.status == 'completed']),
        'late_returns': len([t for t in transactions if t.status == 'overdue'])
    }
    
    new_trust_score = calculate_trust_score(user_data)
    
    # Update user trust metrics
    user.trust_score = new_trust_score
    user.total_ratings = len(ratings)
    user.total_transactions = len(transactions)
    user.successful_transactions = user_data['successful_transactions']
    user.late_returns = user_data['late_returns']
    
    if len(ratings) > 0:
        user.average_rating = sum(r.rating for r in ratings) / len(ratings)
    
    # Determine new badges
    ratings_data = [{'rating': r.rating, 'rating_type': r.rating_type} for r in ratings]
    transactions_data = [{'status': t.status} for t in transactions]
    
    new_badges = determine_badges_to_award(user, ratings_data, transactions_data)
    
    # Update badges (deactivate old ones, add new ones)
    for badge in user.trust_badges:
        badge.is_active = badge.badge_type in new_badges
    
    # Add new badges that don't exist
    existing_badge_types = [b.badge_type for b in user.trust_badges]
    for badge_type in new_badges:
        if badge_type not in existing_badge_types:
            new_badge = TrustBadge(user_id=user_id, badge_type=badge_type)
            db.add(new_badge)
    
    await db.commit()
    
    return {
        "message": "Trust score updated successfully",
        "new_trust_score": new_trust_score,
        "badges": new_badges
    }

@router.get("/leaderboard", response_model=List[UserTrustSummary])
async def get_trust_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get top users by trust score (for gamification)
    """
    result = await db.execute(
        select(User)
        .where(User.is_profile_hidden == False)
        .options(selectinload(User.trust_badges))
        .order_by(desc(User.trust_score))
        .limit(limit)
    )
    
    users = result.scalars().all()
    
    return [
        UserTrustSummary(
            user_id=user.id,
            username=user.username,
            average_rating=float(user.average_rating) if user.average_rating else 0.0,
            total_ratings=user.total_ratings or 0,
            trust_score=float(user.trust_score) if user.trust_score else 100.0,
            trust_level=user.trust_level,
            badges=[badge.badge_type for badge in user.trust_badges if badge.is_active]
        )
        for user in users
    ]
