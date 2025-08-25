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
from models.password_reset import PasswordReset
from schemas.user import UserCreate, UserLogin, UserOut, ForgotPasswordRequest, ResetPasswordRequest, VerifyResetCodeRequest, TokenResponse, RefreshTokenRequest
from config.database import get_db
from config.settings import settings
from utils.auth_utils import create_access_token, create_refresh_token, hash_password, verify_password, get_current_user, oauth2_scheme, verify_refresh_token
from utils.email_service import email_service
from datetime import datetime, timedelta

router = APIRouter(tags=["auth"])

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user.username))
    if result.scalars().first():
        raise HTTPException(400, "Username already taken")
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalars().first():
        raise HTTPException(400, "Email already registered")

    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        city=user.city
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Create both access and refresh tokens
    access_token, access_expires = create_access_token(data={"sub": user.username})
    refresh_token, refresh_expires = create_refresh_token(data={"sub": user.username})
    
    # Store tokens in database
    token_record = TokenTable(
        user_id=db_user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires=access_expires,
        refresh_token_expires=refresh_expires,
        status=True
    )
    db.add(token_record)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(db_user.id),
            "username": db_user.username,
            "email": db_user.email,
            "city": db_user.city,
            "created_at": db_user.created_at.isoformat()
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user.username))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    # Create both access and refresh tokens
    access_token, access_expires = create_access_token(data={"sub": user.username})
    refresh_token, refresh_expires = create_refresh_token(data={"sub": user.username})
    
    # Store tokens in database
    token_record = TokenTable(
        user_id=db_user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires=access_expires,
        refresh_token_expires=refresh_expires,
        status=True
    )
    db.add(token_record)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        "user": {
            "id": str(db_user.id), 
            "username": db_user.username, 
            "email": db_user.email,
            "city": db_user.city, 
            "created_at": db_user.created_at.isoformat()
        }
    }

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

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    payload = verify_refresh_token(request.refresh_token)
    username = payload.get("sub")
    
    # Get user
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")
    
    # Find the token record with this refresh token
    token_result = await db.execute(
        select(TokenTable).filter(
            TokenTable.user_id == user.id,
            TokenTable.refresh_token == request.refresh_token,
            TokenTable.status == True
        )
    )
    token_record = token_result.scalars().first()
    
    if not token_record:
        raise HTTPException(401, "Invalid refresh token")
    
    # Check if refresh token is expired
    if token_record.refresh_token_expires and datetime.utcnow() > token_record.refresh_token_expires:
        # Invalidate the token record
        token_record.status = False
        db.add(token_record)
        await db.commit()
        raise HTTPException(401, "Refresh token expired")
    
    # Create new access token (and optionally new refresh token)
    new_access_token, access_expires = create_access_token(data={"sub": username})
    new_refresh_token, refresh_expires = create_refresh_token(data={"sub": username})
    
    # Update token record with new tokens
    token_record.access_token = new_access_token
    token_record.refresh_token = new_refresh_token
    token_record.access_token_expires = access_expires
    token_record.refresh_token_expires = refresh_expires
    
    db.add(token_record)
    await db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Send password reset code to user's email
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists in our system, you will receive a password reset code shortly."}
    
    # Generate reset code
    reset_code = email_service.generate_reset_code()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.RESET_CODE_EXPIRE_MINUTES)
    
    # Invalidate any existing reset codes for this user
    from sqlalchemy import update
    await db.execute(
        update(PasswordReset)
        .where(PasswordReset.user_id == user.id, PasswordReset.is_used == False)
        .values(is_used=True)
    )
    
    # Create new reset record
    reset_record = PasswordReset(
        user_id=user.id,
        reset_code=reset_code,
        expires_at=expires_at
    )
    db.add(reset_record)
    await db.commit()
    
    # Check if email service is configured
    if email_service.is_email_configured():
        # Send email in production
        email_sent = await email_service.send_reset_code_email(
            email=user.email,
            username=user.username,
            reset_code=reset_code
        )
        
        if not email_sent:
            raise HTTPException(500, "Failed to send reset email. Please try again later.")
        
        return {"message": "If the email exists in our system, you will receive a password reset code shortly."}
    else:
        # Development mode - return the code in the response (NOT for production!)
        if settings.ENVIRONMENT == "development":
            print(f"🔧 DEVELOPMENT MODE: Reset code for {user.email}: {reset_code}")
            return {
                "message": "Email service not configured. In development mode, check server logs for the reset code.",
                "dev_reset_code": reset_code  # Only in development!
            }
        else:
            raise HTTPException(500, "Email service is not configured. Please contact support.")

@router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify if the reset code is valid (optional endpoint for better UX)
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(404, "Invalid email or reset code")
    
    # Find valid reset code
    reset_result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.reset_code == request.reset_code,
            PasswordReset.is_used == False
        )
    )
    reset_record = reset_result.scalars().first()
    
    if not reset_record or not reset_record.is_valid:
        raise HTTPException(400, "Invalid or expired reset code")
    
    return {"message": "Reset code is valid", "valid": True}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Reset user password using the reset code
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(404, "Invalid email or reset code")
    
    # Find valid reset code
    reset_result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.reset_code == request.reset_code,
            PasswordReset.is_used == False
        )
    )
    reset_record = reset_result.scalars().first()
    
    if not reset_record or not reset_record.is_valid:
        raise HTTPException(400, "Invalid or expired reset code")
    
    # Update user password
    user.password_hash = hash_password(request.new_password)
    
    # Mark reset code as used
    reset_record.is_used = True
    
    # Invalidate all existing tokens for this user (force re-login)
    from sqlalchemy import update
    await db.execute(
        update(TokenTable)
        .where(TokenTable.user_id == user.id)
        .values(status=False)
    )
    
    # Commit changes
    db.add(user)
    db.add(reset_record)
    await db.commit()
    
    return {"message": "Password reset successfully. Please log in with your new password."}
