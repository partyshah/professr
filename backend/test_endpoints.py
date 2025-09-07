"""Test the new AI endpoints directly"""
import requests
import json

# Backend URL (update if different)
BASE_URL = "http://localhost:8000"

def test_new_ai_endpoints():
    print("🧪 Testing New AI Endpoints")
    print("=" * 40)
    
    # Step 1: Start AI session
    print("\n1. Starting AI session...")
    start_response = requests.post(f"{BASE_URL}/start-ai-session", 
        json={
            "student_id": 1,
            "assignment_id": 1
        }
    )
    
    if start_response.status_code != 200:
        print(f"❌ Start session failed: {start_response.status_code}")
        print(start_response.text)
        return
    
    session_data = start_response.json()
    print(f"✅ Session started: {session_data}")
    
    session_id = session_data["session_id"]
    
    # Step 2: Send first message
    print("\n2. Sending first message...")
    chat_response = requests.post(f"{BASE_URL}/ai-chat",
        json={
            "session_id": session_id,
            "message": "Hello, I'm ready to discuss today's readings."
        }
    )
    
    if chat_response.status_code != 200:
        print(f"❌ Chat failed: {chat_response.status_code}")
        print(chat_response.text)
        return
    
    chat_data = chat_response.json()
    print(f"✅ AI Response: {chat_data['response']}")
    print(f"Question Count: {chat_data['question_count']}")
    print(f"Phase: {chat_data['phase']}")
    
    # Step 3: Send follow-up
    print("\n3. Sending follow-up message...")
    chat_response2 = requests.post(f"{BASE_URL}/ai-chat",
        json={
            "session_id": session_id,
            "message": "Aristotle talks about humans being political animals. I think this means we naturally form communities."
        }
    )
    
    if chat_response2.status_code == 200:
        chat_data2 = chat_response2.json()
        print(f"✅ AI Response 2: {chat_data2['response']}")
        print(f"Question Count: {chat_data2['question_count']}")
    else:
        print(f"❌ Second chat failed: {chat_response2.status_code}")

if __name__ == "__main__":
    test_new_ai_endpoints()