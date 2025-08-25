# schemas/request.py
from pydantic import UUID4
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
from datetime import datetime

class RequestCreate(BaseModel):
    book_title: str

class RequestOut(BaseModel):
    id: UUID4
    book_title: str
    # user_id: str
    user_id: UUID4
    created_at: datetime
    username: str

    class Config:
        from_attributes = True
        # json_encoders = {
        #     UUID4: str  # Convert UUID to string in JSON
        # }
        json_encoders = {UUID: str}
