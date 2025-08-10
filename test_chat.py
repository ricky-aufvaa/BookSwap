#!/usr/bin/env python3
"""
Simple test script to verify chat functionality is working
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"

def test_chat_functionality():
    print("🧪 Testing BookSwap Chat Functionality")
    print("=" * 40)
    
    # Test data
    user1_data = {
        "username": "testuser1",
        "password": "password123",
        "city": "TestCity"
    }
    
    user2_data = {
        "username": "testuser2", 
        "password": "password123",
        "city": "TestCity"
    }
    
    book_data = {
        "title": "Test Book",
        "author": "Test Author"
    }
    
    try:
        # 1. Create test users
        print("1. Creating test users...")
        
        # Create user 1
        response1 = requests.post(f"{BASE_URL}/signup", json=user1_data)
        if response1.status_code == 201:
            user1_token = response1.json()["access_token"]
            print("   ✅ User 1 created successfully")
        else:
            # Try login if user exists
            login_response = requests.post(f"{BASE_URL}/login", json={
                "username": user1_data["username"],
                "password": user1_data["password"]
            })
            if login_response.status_code == 200:
                user1_token = login_response.json()["access_token"]
                print("   ✅ User 1 logged in successfully")
            else:
                print(f"   ❌ Failed to create/login user 1: {response1.text}")
                return False
        
        # Create user 2
        response2 = requests.post(f"{BASE_URL}/signup", json=user2_data)
        if response2.status_code == 201:
            user2_token = response2.json()["access_token"]
            user2_id = response2.json()["id"] if "id" in response2.json() else None
            print("   ✅ User 2 created successfully")
        else:
            # Try login if user exists
            login_response = requests.post(f"{BASE_URL}/login", json={
                "username": user2_data["username"],
                "password": user2_data["password"]
            })
            if login_response.status_code == 200:
                user2_token = login_response.json()["access_token"]
                print("   ✅ User 2 logged in successfully")
            else:
                print(f"   ❌ Failed to create/login user 2: {response2.text}")
                return False
        
        # 2. Add a book for user 2
        print("2. Adding a book for user 2...")
        headers2 = {"Authorization": f"Bearer {user2_token}"}
        book_response = requests.post(f"{BASE_URL}/books/", json=book_data, headers=headers2)
        if book_response.status_code == 201:
            print("   ✅ Book added successfully")
        else:
            print(f"   ❌ Failed to add book: {book_response.text}")
            return False
        
        # 3. Search for book owners as user 1
        print("3. Searching for book owners...")
        headers1 = {"Authorization": f"Bearer {user1_token}"}
        search_response = requests.get(
            f"{BASE_URL}/books/search-owners",
            params={"book_title": book_data["title"]},
            headers=headers1
        )
        if search_response.status_code == 200:
            owners = search_response.json()
            if owners:
                user2_id = owners[0]["id"]
                print(f"   ✅ Found {len(owners)} book owner(s)")
            else:
                print("   ⚠️  No book owners found")
                return False
        else:
            print(f"   ❌ Failed to search book owners: {search_response.text}")
            return False
        
        # 4. Create chat room
        print("4. Creating chat room...")
        chat_data = {
            "other_user_id": user2_id,
            "book_title": book_data["title"]
        }
        chat_response = requests.post(f"{BASE_URL}/chat/rooms", json=chat_data, headers=headers1)
        if chat_response.status_code == 201:
            chat_room = chat_response.json()
            room_id = chat_room["id"]
            print("   ✅ Chat room created successfully")
        else:
            print(f"   ❌ Failed to create chat room: {chat_response.text}")
            return False
        
        # 5. Send a message
        print("5. Sending a message...")
        message_data = {"message": "Hi! I'm interested in your book."}
        message_response = requests.post(
            f"{BASE_URL}/chat/rooms/{room_id}/messages",
            json=message_data,
            headers=headers1
        )
        if message_response.status_code == 201:
            print("   ✅ Message sent successfully")
        else:
            print(f"   ❌ Failed to send message: {message_response.text}")
            return False
        
        # 6. Get chat rooms for user 2
        print("6. Getting chat rooms for user 2...")
        rooms_response = requests.get(f"{BASE_URL}/chat/rooms", headers=headers2)
        if rooms_response.status_code == 200:
            rooms = rooms_response.json()
            if rooms:
                print(f"   ✅ Found {len(rooms)} chat room(s)")
            else:
                print("   ⚠️  No chat rooms found")
        else:
            print(f"   ❌ Failed to get chat rooms: {rooms_response.text}")
            return False
        
        # 7. Get messages in chat room
        print("7. Getting messages in chat room...")
        messages_response = requests.get(f"{BASE_URL}/chat/rooms/{room_id}", headers=headers2)
        if messages_response.status_code == 200:
            chat_room_with_messages = messages_response.json()
            messages = chat_room_with_messages.get("messages", [])
            print(f"   ✅ Found {len(messages)} message(s)")
        else:
            print(f"   ❌ Failed to get messages: {messages_response.text}")
            return False
        
        print("\n🎉 All chat functionality tests passed!")
        print("\nChat features working:")
        print("   ✅ User registration/login")
        print("   ✅ Book management")
        print("   ✅ Book owner search")
        print("   ✅ Chat room creation")
        print("   ✅ Message sending")
        print("   ✅ Chat room listing")
        print("   ✅ Message retrieval")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = test_chat_functionality()
    if not success:
        print("\n💡 Troubleshooting tips:")
        print("1. Make sure the backend is running: docker-compose up backend")
        print("2. Check if the database migration was successful")
        print("3. Verify the API is accessible at http://localhost:8000/docs")
        exit(1)
    else:
        print("\n🚀 Your BookSwap chat system is working perfectly!")
