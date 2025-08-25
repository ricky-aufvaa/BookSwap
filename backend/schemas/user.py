# schemas/user.py
from pydantic import BaseModel, UUID4, EmailStr, validator
from uuid import UUID
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    city: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserLogin(BaseModel):
    username: str
    password: str
    city: Optional[str] = None

class UserOut(BaseModel):
    id: UUID4
    username: str
    email: str
    city: Optional[str] = None

    class Config:
        orm_mode = True
        json_encoders = {
            UUID: str  # Convert UUID to string in JSON
        }

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str
    
    @validator('reset_code')
    def validate_reset_code(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError('Reset code must be a 6-digit number')
        return v
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    reset_code: str
    
    @validator('reset_code')
    def validate_reset_code(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError('Reset code must be a 6-digit number')
        return v
