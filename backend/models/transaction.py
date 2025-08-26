# models/transaction.py
from sqlalchemy import Column, String, DateTime, Boolean, DECIMAL, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from config.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'borrow', 'swap', 'buy', 'rent'
    status = Column(String(20), default='pending')  # 'pending', 'active', 'completed', 'overdue', 'cancelled'
    start_date = Column(DateTime(timezone=True))
    expected_return_date = Column(DateTime(timezone=True))
    actual_return_date = Column(DateTime(timezone=True))
    security_deposit = Column(DECIMAL(10, 2), default=0.0)
    rental_fee = Column(DECIMAL(10, 2), default=0.0)
    notes = Column(Text)  # Additional notes about the transaction
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships (using string references to avoid circular imports)
    book = relationship("Book", back_populates="transactions")
    owner = relationship("User", foreign_keys="[Transaction.owner_id]", back_populates="owned_transactions")
    requester = relationship("User", foreign_keys="[Transaction.requester_id]", back_populates="requested_transactions")
    ratings = relationship("UserRating", back_populates="transaction", cascade="all, delete-orphan")
    
    @property
    def is_overdue(self):
        """Check if transaction is overdue"""
        if self.status == 'active' and self.expected_return_date:
            from datetime import datetime
            return datetime.utcnow() > self.expected_return_date
        return False
    
    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if self.is_overdue:
            from datetime import datetime
            return (datetime.utcnow() - self.expected_return_date).days
        return 0
