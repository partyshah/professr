"""Test script for the AI tutoring system"""
import asyncio
import os
from dotenv import load_dotenv
from ai_service import AITutorService

# Load environment variables
load_dotenv()

async def test_ai_system():
    """Test the complete AI tutoring flow"""
    
    ai_service = AITutorService()
    
    print("🧪 Testing AI Tutoring System")
    print("=" * 50)
    
    # Test 1: Initialize session
    print("\n1. Initializing session with PDF context...")
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    session_id = "test_session_123"
    
    result = ai_service.initialize_session(session_id, pdf_paths)
    print(f"Result: {result}")
    
    if not result['success']:
        print("❌ Session initialization failed!")
        return
    
    print("✅ Session initialized successfully!")
    
    # Test 2: First message
    print("\n2. Testing first AI response...")
    response, metadata = ai_service.get_ai_response(
        session_id, 
        "Hello, I'm ready to discuss today's readings about Aristotle's Politics."
    )
    
    print(f"AI Response: {response}")
    print(f"Metadata: {metadata}")
    
    # Test 3: Follow-up message
    print("\n3. Testing follow-up response...")
    response2, metadata2 = ai_service.get_ai_response(
        session_id,
        "Aristotle seems to think that humans are naturally political animals. I think this means we need community to be fully human."
    )
    
    print(f"AI Response 2: {response2}")
    print(f"Question Count: {metadata2.get('question_count')}")
    print(f"Phase: {metadata2.get('phase')}")
    
    # Test 4: Session stats
    print("\n4. Getting session statistics...")
    stats = ai_service.get_session_stats(session_id)
    print(f"Session stats: {stats}")
    
    # Test 5: Cleanup
    print("\n5. Cleaning up session...")
    ai_service.cleanup_session(session_id)
    
    print("\n✅ All tests completed successfully!")
    print(f"Estimated cost for 2 messages: ~${metadata2.get('token_usage', {}).get('estimated_cost', 0):.4f}")

if __name__ == "__main__":
    asyncio.run(test_ai_system())