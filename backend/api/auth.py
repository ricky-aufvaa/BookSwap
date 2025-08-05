# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext

from models.user import User
from schemas.user import UserCreate, UserLogin, UserOut
from config.database import get_db
from utils.auth_utils import create_access_token, hash_password,verify_password

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
    return {**db_user.__dict__, "access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": {"username": db_user.username, "city": db_user.city}}