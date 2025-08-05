# schemas/user.py
from pydantic import BaseModel,UUID4
from uuid import UUID
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    city: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
    city: Optional[str] = None

class UserOut(BaseModel):
    id: UUID4
    # id: UUID4
    username: str
    city: Optional[str] = None

    class Config:
        orm_mode = True
        json_encoders = {
            UUID: str  # Convert UUID to string in JSON
        }