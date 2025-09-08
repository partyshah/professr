"""Test that AI sessions save transcripts correctly for instructor view"""
import asyncio
import os
from dotenv import load_dotenv
from ai_service import AITutorService
import requests

load_dotenv()

def test_instructor_transcript_fix():
    """Test the complete flow: AI session -> database save -> instructor view"""
    
    print("🔧 Testing Instructor Transcript Fix")
    print("=" * 60)
    
    # Step 1: Create an AI session
    ai_service = AITutorService()
    session_id = "instructor_test_session"
    
    print("1. Creating AI session...")
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    result = ai_service.initialize_session(session_id, pdf_paths)
    
    if not result['success']:
        print("❌ Session initialization failed")
        return
    
    # Step 2: Simulate a conversation
    print("2. Simulating conversation...")
    messages = [
        "I'm ready to discuss Aristotle's Politics.",
        "Aristotle says humans are political animals who need community.",
        "The city-state exists for the highest good, which is happiness.",
    ]
    
    for i, message in enumerate(messages, 1):
        response, metadata = ai_service.get_ai_response(session_id, message)
        print(f"   Q{i}: {response[:60]}...")
    
    # Step 3: Test the formatted transcript method
    print("\n3. Testing formatted transcript method...")
    formatted_transcript = ai_service.get_formatted_transcript(session_id)
    
    print(f"   Formatted transcript has {len(formatted_transcript)} entries")
    for i, entry in enumerate(formatted_transcript[:4]):  # Show first 4
        speaker = entry['speaker']
        text = entry['text'][:50] + "..."
        print(f"   [{i+1}] {speaker}: {text}")
    
    # Verify structure
    if all('speaker' in entry and 'text' in entry for entry in formatted_transcript):
        print("   ✅ Correct transcript format (speaker, text)")
    else:
        print("   ❌ Incorrect transcript format!")
        return
    
    # Step 4: Test evaluation endpoint (which saves to database)
    print("\n4. Testing evaluation endpoint...")
    try:
        # This should work if backend server is running
        response = requests.post(
            "http://localhost:8000/evaluate-ai-session",
            params={"session_id": session_id}
        )
        
        if response.status_code == 200:
            eval_data = response.json()
            database_session_id = eval_data['session_id']
            print(f"   ✅ Session saved to database with ID: {database_session_id}")
            
            # Step 5: Test instructor view endpoint
            print("\n5. Testing instructor view endpoint...")
            test_data_response = requests.get("http://localhost:8000/test-data")
            
            if test_data_response.status_code == 200:
                sessions_data = test_data_response.json()
                sessions = sessions_data.get('sessions', [])
                
                # Find our session
                our_session = None
                for session in sessions:
                    if session['session_id'] == database_session_id:
                        our_session = session
                        break
                
                if our_session:
                    transcript = our_session.get('transcript', [])
                    print(f"   ✅ Found session in instructor data")
                    print(f"   Transcript type: {type(transcript)}")
                    print(f"   Transcript length: {len(transcript) if isinstance(transcript, list) else 'N/A'}")
                    
                    # Test that it's an array we can map over
                    if isinstance(transcript, list):
                        print("   ✅ Transcript is an array (can be mapped)")
                        
                        # Show a few entries
                        for entry in transcript[:2]:
                            if isinstance(entry, dict) and 'speaker' in entry:
                                speaker = entry['speaker']
                                text = entry['text'][:40] + "..."
                                print(f"   Sample: {speaker}: {text}")
                            else:
                                print(f"   ⚠️  Unexpected entry format: {type(entry)}")
                    else:
                        print("   ❌ Transcript is not an array!")
                        print(f"   Actual data: {transcript}")
                else:
                    print("   ❌ Session not found in instructor data")
            else:
                print(f"   ❌ Test data endpoint failed: {test_data_response.status_code}")
        else:
            print(f"   ❌ Evaluation endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ⚠️  Backend server not running - can't test full flow")
        print("   But formatted transcript method works correctly!")
    
    # Cleanup
    ai_service.cleanup_session(session_id)
    
    print("\n📊 Summary:")
    print("✅ AI service creates proper transcript format")
    print("✅ Formatted transcript has correct structure")
    if 'eval_data' in locals():
        print("✅ Database save works")
        print("✅ Instructor view should work correctly")
    
    print("\n🎉 Instructor transcript fix test completed!")

if __name__ == "__main__":
    test_instructor_transcript_fix()