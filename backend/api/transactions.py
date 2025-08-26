# api/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc
from typing import List
from uuid import UUID
from datetime import datetime

from models.user import User
from models.transaction import Transaction
from models.book import Book
from schemas.transaction import TransactionCreate, TransactionOut, TransactionStatusUpdate, TransactionSummary
from config.database import get_db
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionOut, status_code=201)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new transaction (book request)
    """
    # Verify the book exists and get owner info
    book_result = await db.execute(
        select(Book)
        .where(Book.id == transaction_data.book_id)
        .options(selectinload(Book.owner))
    )
    book = book_result.scalars().first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Verify the owner is correct
    if book.owner_id != transaction_data.owner_id:
        raise HTTPException(status_code=400, detail="Invalid owner for this book")
    
    # Verify user is not trying to request their own book
    if current_user.id == book.owner_id:
        raise HTTPException(status_code=400, detail="You cannot request your own book")
    
    # Check if there's already an active transaction for this book
    existing_transaction_result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.book_id == transaction_data.book_id,
                Transaction.status.in_(['pending', 'active'])
            )
        )
    )
    existing_transaction = existing_transaction_result.scalars().first()
    
    if existing_transaction:
        raise HTTPException(status_code=400, detail="This book already has an active transaction")
    
    # Create the transaction
    transaction = Transaction(
        book_id=transaction_data.book_id,
        owner_id=transaction_data.owner_id,
        requester_id=current_user.id,
        transaction_type=transaction_data.transaction_type,
        expected_return_date=transaction_data.expected_return_date,
        security_deposit=transaction_data.security_deposit or 0.0,
        rental_fee=transaction_data.rental_fee or 0.0,
        notes=transaction_data.notes,
        status='pending'
    )
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    # Load related data for response
    await db.refresh(transaction, ['book', 'owner', 'requester'])
    
    return format_transaction_response(transaction)

@router.get("/", response_model=List[TransactionSummary])
async def get_user_transactions(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all transactions for the current user
    """
    query = select(Transaction).where(
        or_(
            Transaction.owner_id == current_user.id,
            Transaction.requester_id == current_user.id
        )
    ).options(
        selectinload(Transaction.book),
        selectinload(Transaction.owner),
        selectinload(Transaction.requester)
    ).order_by(desc(Transaction.created_at))
    
    if status:
        query = query.where(Transaction.status == status)
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return [
        TransactionSummary(
            id=transaction.id,
            book_title=transaction.book.title if transaction.book else "Unknown Book",
            other_user_username=(
                transaction.requester.username if transaction.owner_id == current_user.id 
                else transaction.owner.username
            ),
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            created_at=transaction.created_at,
            expected_return_date=transaction.expected_return_date,
            is_overdue=transaction.is_overdue
        )
        for transaction in transactions
    ]

@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific transaction
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id == transaction_id)
        .options(
            selectinload(Transaction.book),
            selectinload(Transaction.owner),
            selectinload(Transaction.requester)
        )
    )
    transaction = result.scalars().first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify user has access to this transaction
    if current_user.id not in [transaction.owner_id, transaction.requester_id]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return format_transaction_response(transaction)

@router.patch("/{transaction_id}/status", response_model=TransactionOut)
async def update_transaction_status(
    transaction_id: UUID,
    status_update: TransactionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update transaction status (approve, reject, complete, etc.)
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id == transaction_id)
        .options(
            selectinload(Transaction.book),
            selectinload(Transaction.owner),
            selectinload(Transaction.requester)
        )
    )
    transaction = result.scalars().first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify user has permission to update this transaction
    if current_user.id not in [transaction.owner_id, transaction.requester_id]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate status transitions
    valid_transitions = {
        'pending': ['active', 'cancelled'],
        'active': ['completed', 'overdue', 'cancelled'],
        'overdue': ['completed', 'cancelled'],
        'completed': [],  # Final state
        'cancelled': []   # Final state
    }
    
    if status_update.status not in valid_transitions.get(transaction.status, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot transition from {transaction.status} to {status_update.status}"
        )
    
    # Additional permission checks
    if status_update.status == 'active' and current_user.id != transaction.owner_id:
        raise HTTPException(status_code=403, detail="Only the book owner can approve transactions")
    
    if status_update.status == 'completed' and current_user.id != transaction.owner_id:
        raise HTTPException(status_code=403, detail="Only the book owner can mark transactions as completed")
    
    # Update transaction
    transaction.status = status_update.status
    if status_update.notes:
        transaction.notes = status_update.notes
    
    # Set timestamps based on status
    if status_update.status == 'active':
        transaction.start_date = datetime.utcnow()
    elif status_update.status == 'completed':
        transaction.actual_return_date = status_update.actual_return_date or datetime.utcnow()
    
    await db.commit()
    
    # Update user transaction stats if completed
    if status_update.status == 'completed':
        await update_user_transaction_stats(transaction.owner_id, db)
        await update_user_transaction_stats(transaction.requester_id, db)
    
    return format_transaction_response(transaction)

@router.get("/pending/received", response_model=List[TransactionSummary])
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get pending transaction requests received by the current user (as book owner)
    """
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.owner_id == current_user.id,
                Transaction.status == 'pending'
            )
        )
        .options(
            selectinload(Transaction.book),
            selectinload(Transaction.requester)
        )
        .order_by(desc(Transaction.created_at))
    )
    
    transactions = result.scalars().all()
    
    return [
        TransactionSummary(
            id=transaction.id,
            book_title=transaction.book.title if transaction.book else "Unknown Book",
            other_user_username=transaction.requester.username,
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            created_at=transaction.created_at,
            expected_return_date=transaction.expected_return_date,
            is_overdue=False  # Pending transactions can't be overdue
        )
        for transaction in transactions
    ]

@router.get("/active/borrowed", response_model=List[TransactionSummary])
async def get_active_borrowed_books(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get books currently borrowed by the user
    """
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.requester_id == current_user.id,
                Transaction.status == 'active'
            )
        )
        .options(
            selectinload(Transaction.book),
            selectinload(Transaction.owner)
        )
        .order_by(desc(Transaction.start_date))
    )
    
    transactions = result.scalars().all()
    
    return [
        TransactionSummary(
            id=transaction.id,
            book_title=transaction.book.title if transaction.book else "Unknown Book",
            other_user_username=transaction.owner.username,
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            created_at=transaction.created_at,
            expected_return_date=transaction.expected_return_date,
            is_overdue=transaction.is_overdue
        )
        for transaction in transactions
    ]

@router.get("/active/lent", response_model=List[TransactionSummary])
async def get_active_lent_books(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get books currently lent out by the user
    """
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.owner_id == current_user.id,
                Transaction.status == 'active'
            )
        )
        .options(
            selectinload(Transaction.book),
            selectinload(Transaction.requester)
        )
        .order_by(desc(Transaction.start_date))
    )
    
    transactions = result.scalars().all()
    
    return [
        TransactionSummary(
            id=transaction.id,
            book_title=transaction.book.title if transaction.book else "Unknown Book",
            other_user_username=transaction.requester.username,
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            created_at=transaction.created_at,
            expected_return_date=transaction.expected_return_date,
            is_overdue=transaction.is_overdue
        )
        for transaction in transactions
    ]

def format_transaction_response(transaction: Transaction) -> TransactionOut:
    """
    Format a transaction for API response
    """
    return TransactionOut(
        id=transaction.id,
        book_id=transaction.book_id,
        owner_id=transaction.owner_id,
        requester_id=transaction.requester_id,
        transaction_type=transaction.transaction_type,
        status=transaction.status,
        start_date=transaction.start_date,
        expected_return_date=transaction.expected_return_date,
        actual_return_date=transaction.actual_return_date,
        security_deposit=transaction.security_deposit,
        rental_fee=transaction.rental_fee,
        notes=transaction.notes,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
        is_overdue=transaction.is_overdue,
        days_overdue=transaction.days_overdue,
        book_title=transaction.book.title if transaction.book else None,
        book_author=transaction.book.author if transaction.book else None,
        owner_username=transaction.owner.username if transaction.owner else None,
        requester_username=transaction.requester.username if transaction.requester else None
    )

async def update_user_transaction_stats(user_id: UUID, db: AsyncSession):
    """
    Update a user's transaction statistics
    """
    # Get all transactions for this user
    result = await db.execute(
        select(Transaction)
        .where(
            or_(
                Transaction.owner_id == user_id,
                Transaction.requester_id == user_id
            )
        )
    )
    transactions = result.scalars().all()
    
    # Calculate stats
    total_transactions = len(transactions)
    successful_transactions = len([t for t in transactions if t.status == 'completed'])
    late_returns = len([t for t in transactions if t.status == 'overdue' or 
                       (t.actual_return_date and t.expected_return_date and 
                        t.actual_return_date > t.expected_return_date)])
    
    # Update user stats
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalars().first()
    
    if user:
        user.total_transactions = total_transactions
        user.successful_transactions = successful_transactions
        user.late_returns = late_returns
        await db.commit()
