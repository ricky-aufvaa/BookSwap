# schemas/chat.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageOut(BaseModel):
    id: UUID
    chat_room_id: UUID
    sender_id: UUID
    sender_username: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRoomCreate(BaseModel):
    other_user_id: UUID
    book_title: str

class ChatRoomOut(BaseModel):
    id: UUID
    user1_id: UUID
    user2_id: UUID
    user1_username: str
    user2_username: str
    user1_avatar_seed: Optional[str] = None
    user2_avatar_seed: Optional[str] = None
    book_title: str
    created_at: datetime
    last_message_at: datetime
    last_message: Optional[str] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class ChatRoomWithMessages(BaseModel):
    id: UUID
    user1_id: UUID
    user2_id: UUID
    user1_username: str
    user2_username: str
    user1_avatar_seed: Optional[str] = None
    user2_avatar_seed: Optional[str] = None
    book_title: str
    created_at: datetime
    last_message_at: datetime
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True
