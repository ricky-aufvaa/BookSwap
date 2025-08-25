# models/user.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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
    
    # Relationships
    books = relationship("Book", back_populates="owner")
    tokens = relationship("TokenTable", back_populates="user")
    password_resets = relationship("PasswordReset", back_populates="user")
