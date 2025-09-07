"""Test the full frontend-to-backend AI flow"""
import requests
import json

# Backend URL
BASE_URL = "http://localhost:8000"

def test_frontend_flow():
    print("🧪 Testing Frontend-to-Backend AI Flow")
    print("=" * 50)
    
    # Simulate what the frontend will do
    
    # Step 1: Start AI session (what frontend calls on "Start Assessment")
    print("\n1. Starting AI session (frontend: Start Assessment)...")
    start_response = requests.post(f"{BASE_URL}/start-ai-session", 
        json={
            "student_id": 1,
            "assignment_id": 1
        }
    )
    
    print(f"Status: {start_response.status_code}")
    if start_response.status_code != 200:
        print(f"❌ Error: {start_response.text}")
        return
    
    session_data = start_response.json()
    print(f"✅ Session created: {session_data['session_id']}")
    print(f"Assignment: {session_data['assignment_title']}")
    print(f"PDFs loaded: {session_data['pdf_count']}")
    
    session_id = session_data["session_id"]
    
    # Step 2: First message (what frontend sends after "Hello, I'm ready...")
    print("\n2. Sending first message...")
    response1 = requests.post(f"{BASE_URL}/ai-chat",
        json={
            "session_id": session_id,
            "message": "Hello, I'm ready to begin discussing today's readings."
        }
    )
    
    if response1.status_code == 200:
        data1 = response1.json()
        print(f"✅ AI Response: {data1['response']}")
        print(f"Question {data1['question_count']}, Phase: {data1['phase']}")
    else:
        print(f"❌ Error: {response1.text}")
        return
    
    # Step 3: Student response (simulate student talking about Aristotle)
    print("\n3. Simulating student response about political animals...")
    response2 = requests.post(f"{BASE_URL}/ai-chat",
        json={
            "session_id": session_id,
            "message": "Aristotle says humans are political animals. I think this means we naturally need to be part of a community to be fully human."
        }
    )
    
    if response2.status_code == 200:
        data2 = response2.json()
        print(f"✅ AI Follow-up: {data2['response']}")
        print(f"Question {data2['question_count']}, Phase: {data2['phase']}")
    else:
        print(f"❌ Error: {response2.text}")
        return
    
    # Step 4: Another student response
    print("\n4. Another student response...")
    response3 = requests.post(f"{BASE_URL}/ai-chat",
        json={
            "session_id": session_id,
            "message": "I think the city-state aims for the highest good, which is happiness. We form communities not just to survive, but to live well."
        }
    )
    
    if response3.status_code == 200:
        data3 = response3.json()
        print(f"✅ AI Response: {data3['response']}")
        print(f"Question {data3['question_count']}, Phase: {data3['phase']}")
    else:
        print(f"❌ Error: {response3.text}")
        return
    
    # Step 5: Evaluate session (what frontend calls on "End Session")
    print("\n5. Evaluating session (frontend: End Session)...")
    eval_response = requests.post(f"{BASE_URL}/evaluate-ai-session", 
        params={"session_id": session_id}
    )
    
    if eval_response.status_code == 200:
        eval_data = eval_response.json()
        print(f"✅ Session evaluated and saved to database!")
        print(f"Score: {eval_data['score']}")
        print(f"Category: {eval_data['category']}")
        print(f"Questions asked: {eval_data['question_count']}")
        print(f"Database session ID: {eval_data['session_id']}")
    else:
        print(f"❌ Evaluation error: {eval_response.text}")
    
    print(f"\n🎉 Full flow test completed successfully!")
    print(f"The frontend should now work with the new AI system!")

if __name__ == "__main__":
    test_frontend_flow()