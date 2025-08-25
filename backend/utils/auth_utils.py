# utils/auth_utils.py
from datetime import datetime, timedelta,timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
from fastapi.security import HTTPBearer
from passlib.context import CryptContext
from config.settings import settings
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from sqlalchemy import select
from models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")
oauth2_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM), expire

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM), expire
# def decode_token(token: str):
#     try:
#         payload = jwt.decode(token,settings.SECRET_KEY,algorithms=[settings.ALGORITHM])
#         print("decode token",payload)
#         # payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise HTTPException(401, "Invalid token: missing subject")
#         return username
#     except JWTError:
#         raise HTTPException(401, "Invalid token or expired")
def decode_token(token: str):
    try:
        print("🔍 SECRET_KEY:", settings.SECRET_KEY)
        print("🔍 ALGORITHM:", settings.ALGORITHM)
        print("🔍 Raw token:", token)

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]  # ← Must be a list
        )
        print("✅ Decoded payload:", payload)
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(401, "Invalid token: missing subject")
        return username
    except JWTError as e:
        print("❌ JWT Error:", str(e))  # ← This will show the real issue
        raise HTTPException(401, "Invalid token or expired")

def verify_refresh_token(token: str):
    """Verify refresh token and return payload"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check if it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
            
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(401, "Invalid token: missing subject")
            
        return payload
    except JWTError as e:
        print("❌ Refresh Token Error:", str(e))
        raise HTTPException(401, "Invalid or expired refresh token")

# async def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
# ):
#     token = credentials.credentials  # ← This is the raw JWT
#     try:
#         payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise HTTPException(401, "Invalid token: missing subject")
#         return username
#     except JWTError:
#         raise HTTPException(401, "Invalid token or expired")

# utils/auth_utils.py
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    from models.token import TokenTable
    
    print("the token is ",token)
    username = decode_token(token.credentials)  # returns username
    print("the user namae is ", username)
    
    # Get user
    result = await db.execute(select(User).where(User.username.ilike(username)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")
    
    # Check if token is valid in database
    token_result = await db.execute(
        select(TokenTable).filter(
            TokenTable.user_id == user.id,
            TokenTable.access_token == token.credentials,
            TokenTable.status == True
        )
    )
    token_record = token_result.scalars().first()
    if not token_record:
        raise HTTPException(401, "Token is invalid or has been revoked")
    
    return user  # Return full user object

# async def get_current_user(token: str = Depends(oauth2_scheme)):
#     username = decode_token(token)
#     print("hi")
#     # In real app, fetch user from DB
#     return username
