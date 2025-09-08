"""Test just the transcript formatting logic"""
import os
from dotenv import load_dotenv
from ai_service import AITutorService

load_dotenv()

def test_transcript_formatting():
    """Test that transcript formatting produces the correct structure"""
    
    print("📝 Testing Transcript Formatting Logic")
    print("=" * 50)
    
    # Create AI service and session
    ai_service = AITutorService()
    session_id = "format_test"
    
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    ai_service.initialize_session(session_id, pdf_paths)
    
    # Simulate conversation
    print("1. Building conversation...")
    messages = [
        "Hello, I'm ready to discuss the readings.",
        "Aristotle talks about the city-state and political animals.",
        "I think humans naturally form communities for the good life.",
    ]
    
    for message in messages:
        ai_service.get_ai_response(session_id, message)
    
    # Test the formatting
    print("2. Testing formatted transcript...")
    formatted = ai_service.get_formatted_transcript(session_id)
    
    print(f"   - Entries: {len(formatted)}")
    print(f"   - Type: {type(formatted)}")
    
    # Verify structure
    print("\n3. Verifying structure...")
    
    for i, entry in enumerate(formatted):
        if not isinstance(entry, dict):
            print(f"   ❌ Entry {i} is not a dict: {type(entry)}")
            continue
            
        if 'speaker' not in entry:
            print(f"   ❌ Entry {i} missing 'speaker' field")
            continue
            
        if 'text' not in entry:
            print(f"   ❌ Entry {i} missing 'text' field")
            continue
            
        if entry['speaker'] not in ['student', 'ai']:
            print(f"   ❌ Entry {i} has invalid speaker: {entry['speaker']}")
            continue
            
        print(f"   ✅ Entry {i}: {entry['speaker']} - {entry['text'][:40]}...")
    
    # Test that it can be mapped (like instructor view does)
    print("\n4. Testing map operation (like instructor view)...")
    try:
        mapped_result = [
            f"{entry['speaker']}: {entry['text'][:20]}..." 
            for entry in formatted
        ]
        print(f"   ✅ Map operation successful! {len(mapped_result)} items")
        for item in mapped_result[:3]:
            print(f"      - {item}")
    except Exception as e:
        print(f"   ❌ Map operation failed: {e}")
    
    # Compare to old format that was causing issues
    print("\n5. Comparing to problematic format...")
    old_format = {
        "type": "ai_conversation", 
        "question_count": 3,
        "evaluation": {"score": 75}
    }
    
    print(f"   Old format type: {type(old_format)}")
    try:
        # This would fail
        [item for item in old_format]
        print("   ⚠️  Old format is iterable (unexpected)")
    except TypeError:
        print("   ✅ Old format correctly fails iteration (as expected)")
    
    # Cleanup
    ai_service.cleanup_session(session_id)
    
    print("\n📊 Final Assessment:")
    if (len(formatted) > 0 and 
        all(isinstance(e, dict) and 'speaker' in e and 'text' in e for e in formatted)):
        print("✅ Transcript format is CORRECT for instructor dashboard")
        print("✅ Instructor view should now work without errors")
    else:
        print("❌ Transcript format still has issues")

if __name__ == "__main__":
    test_transcript_formatting()