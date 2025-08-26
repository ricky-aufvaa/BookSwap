# models/user.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, DECIMAL, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from config.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)  # Made nullable for existing users
    password_hash = Column(String, nullable=False)
    city = Column(String, nullable=True)
    avatar_seed = Column(String, nullable=True)  # Store avatar seed for dicebear
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Trust system fields
    average_rating = Column(DECIMAL(3, 2), default=0.0)
    total_ratings = Column(Integer, default=0)
    total_transactions = Column(Integer, default=0)
    successful_transactions = Column(Integer, default=0)
    late_returns = Column(Integer, default=0)
    trust_score = Column(DECIMAL(5, 2), default=100.0)
    is_profile_hidden = Column(Boolean, default=False)
    
    # Relationships
    books = relationship("Book", back_populates="owner")
    tokens = relationship("TokenTable", back_populates="user")
    password_resets = relationship("PasswordReset", back_populates="user")
    
    # Trust system relationships (using string references to avoid circular imports)
    ratings_given = relationship("UserRating", foreign_keys="[UserRating.rater_id]", back_populates="rater")
    ratings_received = relationship("UserRating", foreign_keys="[UserRating.rated_user_id]", back_populates="rated_user")
    trust_badges = relationship("TrustBadge", back_populates="user", cascade="all, delete-orphan")
    owned_transactions = relationship("Transaction", foreign_keys="[Transaction.owner_id]", back_populates="owner")
    requested_transactions = relationship("Transaction", foreign_keys="[Transaction.requester_id]", back_populates="requester")
    
    @property
    def trust_level(self):
        """Get trust level based on trust score"""
        if self.trust_score >= 90:
            return "highly_trusted"
        elif self.trust_score >= 75:
            return "trusted"
        elif self.trust_score >= 60:
            return "reliable"
        elif self.trust_score >= 45:
            return "building_trust"
        else:
            return "use_caution"
    
    @property
    def active_badges(self):
        """Get list of active badge types"""
        return [badge.badge_type for badge in self.trust_badges if badge.is_active]
