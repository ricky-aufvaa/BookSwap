# models/request.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from config.database import Base
from datetime import datetime

class BookRequest(Base):
    __tablename__ = "book_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # username= Column(String, ForeignKey("users.username"), nullable=False)
    book_title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow())