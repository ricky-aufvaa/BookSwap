# schemas/book.py
from pydantic import UUID4
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None

class BookOut(BookBase):
    id: UUID4 
    owner_id: UUID4
    owner_username: str
    created_at: datetime
    thumbnail: Optional[str] = None  # Fixed: uncommented and made optional

    class Config:
        orm_mode = True
        json_encoders = {UUID: str}
