# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from fastapi.security import HTTPAuthorizationCredentials

from models.user import User
from models.token import TokenTable
from schemas.user import UserCreate, UserLogin, UserOut
from config.database import get_db
from config.settings import settings
from utils.auth_utils import create_access_token, hash_password, verify_password, get_current_user, oauth2_scheme

router = APIRouter(tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    if result.scalars().first():
        raise HTTPException(400, "Username already taken")

    db_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        city=user.city
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    token = create_access_token(data={"sub": user.username})
    
    # Store token in database
    token_record = TokenTable(
        user_id=db_user.id,
        access_token=token,
        status=True
    )
    db.add(token_record)
    await db.commit()
    
    return {
        "id": str(db_user.id),
        "username": db_user.username,
        "city": db_user.city,
        "created_at": db_user.created_at.isoformat(),
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(data={"sub": user.username})
    
    # Store token in database
    token_record = TokenTable(
        user_id=db_user.id,
        access_token=token,
        status=True
    )
    db.add(token_record)
    await db.commit()
    
    return {"access_token": token, "token_type": "bearer", "user": {"id": str(db_user.id), "username": db_user.username, "city": db_user.city, "created_at": db_user.created_at.isoformat()}}

@router.get("/validate")
async def validate_token(current_user: User = Depends(get_current_user)):
    """
    Simple endpoint to validate if the current token is valid
    """
    try:
        print(f"Token validation successful for user: {current_user.username}")
        return {"valid": True, "username": current_user.username}
    except Exception as e:
        print(f"Token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Token validation failed")

@router.post("/logout")
async def logout(dependencies: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    token = dependencies.credentials
    payload = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
    user_id = payload['sub']
    
    # Get user to get user_id as UUID
    result = await db.execute(select(User).where(User.username == user_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(404, "User not found")
    
    # Clean up old tokens (older than 1 day)
    token_result = await db.execute(select(TokenTable))
    token_records = token_result.scalars().all()
    info = []
    for record in token_records:
        if (datetime.utcnow() - record.created_date).days > 1:
            info.append(record.user_id)
    
    if info:
        # Delete old tokens
        from sqlalchemy import delete
        await db.execute(delete(TokenTable).where(TokenTable.user_id.in_(info)))
        await db.commit()
    
    # Find and invalidate current token
    existing_token_result = await db.execute(
        select(TokenTable).filter(
            TokenTable.user_id == db_user.id, 
            TokenTable.access_token == token
        )
    )
    existing_token = existing_token_result.scalars().first()
    
    if existing_token:
        existing_token.status = False
        db.add(existing_token)
        await db.commit()
        await db.refresh(existing_token)
    
    return {"message": "Logout Successfully"}
