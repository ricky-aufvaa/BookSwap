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

class BookOut(BookBase):
    id: UUID4 
    owner_id: UUID4
    owner_username: str
    created_at: datetime

    class Config:
        orm_mode = True
        json_encoders = {UUID: str}
