# schemas/transaction.py
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal

class TransactionCreate(BaseModel):
    book_id: UUID
    owner_id: UUID
    transaction_type: str  # 'borrow', 'swap', 'buy', 'rent'
    expected_return_date: Optional[datetime] = None
    security_deposit: Optional[Decimal] = 0.0
    rental_fee: Optional[Decimal] = 0.0
    notes: Optional[str] = None
    
    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        valid_types = ['borrow', 'swap', 'buy', 'rent']
        if v not in valid_types:
            raise ValueError(f'Transaction type must be one of: {valid_types}')
        return v

class TransactionStatusUpdate(BaseModel):
    status: str
    actual_return_date: Optional[datetime] = None
    notes: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['pending', 'active', 'completed', 'overdue', 'cancelled']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v

class TransactionOut(BaseModel):
    id: UUID
    book_id: UUID
    owner_id: UUID
    requester_id: UUID
    transaction_type: str
    status: str
    start_date: Optional[datetime]
    expected_return_date: Optional[datetime]
    actual_return_date: Optional[datetime]
    security_deposit: Decimal
    rental_fee: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Additional computed fields
    is_overdue: bool
    days_overdue: int
    
    # Related data
    book_title: Optional[str] = None
    book_author: Optional[str] = None
    owner_username: Optional[str] = None
    requester_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class TransactionSummary(BaseModel):
    """Lightweight transaction info for lists"""
    id: UUID
    book_title: str
    other_user_username: str  # The other party in the transaction
    transaction_type: str
    status: str
    created_at: datetime
    expected_return_date: Optional[datetime]
    is_overdue: bool
    
    class Config:
        from_attributes = True
