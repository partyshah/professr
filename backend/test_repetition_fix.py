"""Test the repetition fix in conversation management"""
import asyncio
import os
from dotenv import load_dotenv
from ai_service import AITutorService

load_dotenv()

async def test_repetition_fix():
    """Test that AI doesn't repeat phrases after the conversation fix"""
    
    ai_service = AITutorService()
    session_id = "test_repetition_session"
    
    print("🧪 Testing AI Repetition Fix")
    print("=" * 50)
    
    # Initialize session
    print("\n1. Initializing session...")
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    result = ai_service.initialize_session(session_id, pdf_paths)
    
    if not result['success']:
        print("❌ Session init failed")
        return
    
    print("✅ Session initialized")
    
    # Test conversation that previously caused repetition
    messages = [
        "Hello, I'm ready to discuss today's readings about Aristotle's Politics.",
        "Aristotle says the city-state exists for the highest good, which is happiness. I think this means we form communities not just to survive.",
        "The city-state is about living well, not just surviving. It's about achieving our full potential as humans.",
        "I think political animals means we need community to be fully human. We can't achieve the good life alone."
    ]
    
    responses = []
    
    for i, message in enumerate(messages, 1):
        print(f"\n{i}. Student: {message[:80]}...")
        response, metadata = ai_service.get_ai_response(session_id, message)
        responses.append(response)
        print(f"   AI: {response}")
        print(f"   Question: {metadata.get('question_count')}, Phase: {metadata.get('phase')}")
    
    # Check for repetition
    print(f"\n📊 Repetition Analysis:")
    print("=" * 30)
    
    # Check for repeated phrases
    repeated_phrases = []
    key_phrases = ["highest good", "happiness", "political animals", "city-state"]
    
    for phrase in key_phrases:
        count = sum(1 for response in responses if phrase in response.lower())
        if count > 1:
            repeated_phrases.append(f"'{phrase}' appears in {count} responses")
    
    if repeated_phrases:
        print("⚠️  Potential repetitions found:")
        for repeat in repeated_phrases:
            print(f"  - {repeat}")
    else:
        print("✅ No obvious repetitions detected!")
    
    # Check for exact phrase repetition
    print(f"\n🔍 Exact Phrase Analysis:")
    for i, response in enumerate(responses):
        words = response.lower().split()
        # Look for phrases longer than 4 words that appear in other responses
        for j in range(len(words) - 4):
            phrase = " ".join(words[j:j+5])
            for k, other_response in enumerate(responses):
                if i != k and phrase in other_response.lower():
                    print(f"⚠️  Repeated 5-word phrase: '{phrase}' in responses {i+1} and {k+1}")
    
    print(f"\n🎯 Conversation Quality:")
    print(f"   - Total questions asked: {metadata.get('question_count')}")
    print(f"   - Final phase: {metadata.get('phase')}")
    print(f"   - Responses show progression: {'✅' if len(set(responses)) == len(responses) else '❌'}")
    
    # Cleanup
    ai_service.cleanup_session(session_id)
    
    print(f"\n🏁 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_repetition_fix())