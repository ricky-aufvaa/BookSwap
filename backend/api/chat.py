# api/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from models.user import User
from models.chat import ChatRoom, ChatMessage
from schemas.chat import ChatRoomCreate, ChatRoomOut, ChatRoomWithMessages, ChatMessageCreate, ChatMessageOut
from config.database import get_db
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/rooms", response_model=ChatRoomOut, status_code=201)
async def create_or_get_chat_room(
    chat_data: ChatRoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new chat room or get existing one between two users for a specific book
    """
    # Check if chat room already exists between these users for this book
    result = await db.execute(
        select(ChatRoom)
        .where(
            and_(
                ChatRoom.book_title == chat_data.book_title,
                or_(
                    and_(
                        ChatRoom.user1_id == current_user.id,
                        ChatRoom.user2_id == chat_data.other_user_id
                    ),
                    and_(
                        ChatRoom.user1_id == chat_data.other_user_id,
                        ChatRoom.user2_id == current_user.id
                    )
                )
            )
        )
        .options(selectinload(ChatRoom.user1), selectinload(ChatRoom.user2))
    )
    
    existing_room = result.scalars().first()
    if existing_room:
        return ChatRoomOut(
            id=existing_room.id,
            user1_id=existing_room.user1_id,
            user2_id=existing_room.user2_id,
            user1_username=existing_room.user1.username,
            user2_username=existing_room.user2.username,
            user1_avatar_seed=existing_room.user1.avatar_seed,
            user2_avatar_seed=existing_room.user2.avatar_seed,
            book_title=existing_room.book_title,
            created_at=existing_room.created_at,
            last_message_at=existing_room.last_message_at
        )
    
    # Verify the other user exists
    other_user_result = await db.execute(select(User).where(User.id == chat_data.other_user_id))
    other_user = other_user_result.scalars().first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new chat room
    chat_room = ChatRoom(
        user1_id=current_user.id,
        user2_id=chat_data.other_user_id,
        book_title=chat_data.book_title
    )
    
    db.add(chat_room)
    await db.commit()
    await db.refresh(chat_room)
    
    return ChatRoomOut(
        id=chat_room.id,
        user1_id=chat_room.user1_id,
        user2_id=chat_room.user2_id,
        user1_username=current_user.username,
        user2_username=other_user.username,
        user1_avatar_seed=current_user.avatar_seed,
        user2_avatar_seed=other_user.avatar_seed,
        book_title=chat_room.book_title,
        created_at=chat_room.created_at,
        last_message_at=chat_room.last_message_at
    )

@router.get("/rooms", response_model=List[ChatRoomOut])
async def get_my_chat_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all chat rooms for the current user
    """
    result = await db.execute(
        select(ChatRoom)
        .where(
            or_(
                ChatRoom.user1_id == current_user.id,
                ChatRoom.user2_id == current_user.id
            )
        )
        .options(selectinload(ChatRoom.user1), selectinload(ChatRoom.user2))
        .order_by(desc(ChatRoom.last_message_at))
    )
    
    chat_rooms = result.scalars().all()
    
    # Get last message and unread count for each room
    rooms_data = []
    for room in chat_rooms:
        # Get last message
        last_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.chat_room_id == room.id)
            .order_by(desc(ChatMessage.created_at))
            .limit(1)
        )
        last_message = last_msg_result.scalars().first()
        
        # Get unread count
        unread_result = await db.execute(
            select(func.count(ChatMessage.id))
            .where(
                and_(
                    ChatMessage.chat_room_id == room.id,
                    ChatMessage.sender_id != current_user.id,
                    ChatMessage.is_read == False
                )
            )
        )
        unread_count = unread_result.scalar() or 0
        
        rooms_data.append(ChatRoomOut(
            id=room.id,
            user1_id=room.user1_id,
            user2_id=room.user2_id,
            user1_username=room.user1.username,
            user2_username=room.user2.username,
            user1_avatar_seed=room.user1.avatar_seed,
            user2_avatar_seed=room.user2.avatar_seed,
            book_title=room.book_title,
            created_at=room.created_at,
            last_message_at=room.last_message_at,
            last_message=last_message.message if last_message else None,
            unread_count=unread_count
        ))
    
    return rooms_data

@router.get("/rooms/{room_id}", response_model=ChatRoomWithMessages)
async def get_chat_room_with_messages(
    room_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific chat room with all messages
    """
    # Get chat room
    room_result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
        .options(selectinload(ChatRoom.user1), selectinload(ChatRoom.user2))
    )
    room = room_result.scalars().first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check if current user is part of this chat room
    if room.user1_id != current_user.id and room.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get messages
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_room_id == room_id)
        .options(selectinload(ChatMessage.sender))
        .order_by(ChatMessage.created_at)
    )
    messages = messages_result.scalars().all()
    
    # Mark messages as read for current user
    await db.execute(
        select(ChatMessage)
        .where(
            and_(
                ChatMessage.chat_room_id == room_id,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.is_read == False
            )
        )
    )
    
    # Update is_read status
    for message in messages:
        if message.sender_id != current_user.id and not message.is_read:
            message.is_read = True
    
    await db.commit()
    
    # Format messages
    formatted_messages = [
        ChatMessageOut(
            id=msg.id,
            chat_room_id=msg.chat_room_id,
            sender_id=msg.sender_id,
            sender_username=msg.sender.username,
            message=msg.message,
            is_read=msg.is_read,
            created_at=msg.created_at
        )
        for msg in messages
    ]
    
    return ChatRoomWithMessages(
        id=room.id,
        user1_id=room.user1_id,
        user2_id=room.user2_id,
        user1_username=room.user1.username,
        user2_username=room.user2.username,
        user1_avatar_seed=room.user1.avatar_seed,
        user2_avatar_seed=room.user2.avatar_seed,
        book_title=room.book_title,
        created_at=room.created_at,
        last_message_at=room.last_message_at,
        messages=formatted_messages
    )

@router.post("/rooms/{room_id}/messages", response_model=ChatMessageOut, status_code=201)
async def send_message(
    room_id: UUID,
    message_data: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message in a chat room
    """
    # Verify chat room exists and user has access
    room_result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
    )
    room = room_result.scalars().first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if room.user1_id != current_user.id and room.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create message
    message = ChatMessage(
        chat_room_id=room_id,
        sender_id=current_user.id,
        message=message_data.message.strip()
    )
    
    db.add(message)
    
    # Update room's last_message_at
    room.last_message_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(message)
    
    return ChatMessageOut(
        id=message.id,
        chat_room_id=message.chat_room_id,
        sender_id=message.sender_id,
        sender_username=current_user.username,
        message=message.message,
        is_read=message.is_read,
        created_at=message.created_at
    )

@router.delete("/rooms/{room_id}")
async def delete_chat_room(
    room_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a chat room (only if user is part of it)
    """
    room_result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
    )
    room = room_result.scalars().first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if room.user1_id != current_user.id and room.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.delete(room)
    await db.commit()
    
    return {"message": "Chat room deleted successfully"}
