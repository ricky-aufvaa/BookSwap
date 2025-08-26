# schemas/rating.py
from pydantic import BaseModel, validator
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class RatingCreate(BaseModel):
    transaction_id: UUID
    rated_user_id: UUID
    rating: int
    review_text: Optional[str] = None
    rating_type: str  # 'borrower', 'lender', 'buyer', 'seller'
    
    @validator('rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v
    
    @validator('rating_type')
    def validate_rating_type(cls, v):
        valid_types = ['borrower', 'lender', 'buyer', 'seller']
        if v not in valid_types:
            raise ValueError(f'Rating type must be one of: {valid_types}')
        return v

class RatingOut(BaseModel):
    id: UUID
    rater_id: UUID
    rated_user_id: UUID
    transaction_id: UUID
    rating: int
    review_text: Optional[str]
    rating_type: str
    created_at: datetime
    rater_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class TrustBadgeOut(BaseModel):
    id: UUID
    badge_type: str
    earned_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class TrustProfileOut(BaseModel):
    user_id: UUID
    username: str
    average_rating: float
    total_ratings: int
    total_transactions: int
    successful_transactions: int
    late_returns: int
    trust_score: float
    trust_level: str
    is_profile_hidden: bool
    badges: List[TrustBadgeOut]
    recent_ratings: List[RatingOut]
    
    class Config:
        from_attributes = True

class UserTrustSummary(BaseModel):
    """Lightweight trust info for displaying in lists"""
    user_id: UUID
    username: str
    average_rating: float
    total_ratings: int
    trust_score: float
    trust_level: str
    badges: List[str]  # Just badge types
    
    class Config:
        from_attributes = True
