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
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    print("expiry hoga---",expire)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=30))
    print("expiry hoga---",expire)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
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
