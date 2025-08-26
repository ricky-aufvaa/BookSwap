# models/rating.py
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, DECIMAL, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from config.database import Base

class UserRating(Base):
    __tablename__ = "user_ratings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rater_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rated_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'), nullable=False)
    review_text = Column(Text)
    rating_type = Column(String(20), nullable=False)  # 'borrower', 'lender', 'buyer', 'seller'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships (using string references to avoid circular imports)
    rater = relationship("User", foreign_keys="[UserRating.rater_id]", back_populates="ratings_given")
    rated_user = relationship("User", foreign_keys="[UserRating.rated_user_id]", back_populates="ratings_received")
    transaction = relationship("Transaction", back_populates="ratings")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('rater_id', 'transaction_id', name='unique_rating_per_transaction'),
        CheckConstraint('rater_id != rated_user_id', name='cannot_rate_self'),
    )

class TrustBadge(Base):
    __tablename__ = "trust_badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badge_type = Column(String(50), nullable=False)  # 'reliable', 'quick_returner', 'new_user', etc.
    earned_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="trust_badges")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'badge_type', name='unique_badge_per_user'),
    )
