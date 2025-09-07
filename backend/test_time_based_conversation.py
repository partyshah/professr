"""Test the time-based conversation system"""
import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from ai_service import AITutorService

load_dotenv()

async def test_time_based_phases():
    """Test that AI adapts to different time phases"""
    
    ai_service = AITutorService()
    session_id = "test_time_session"
    
    print("🕐 Testing Time-Based Conversation System")
    print("=" * 50)
    
    # Initialize session
    print("\n1. Initializing session...")
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    result = ai_service.initialize_session(session_id, pdf_paths)
    
    if not result['success']:
        print("❌ Session init failed")
        return
    
    print("✅ Session initialized")
    
    # Test different time phases by manipulating start_time
    messages = [
        ("Hello, I'm ready to discuss the readings.", 30),  # 30 seconds in
        ("I think the city-state exists for human flourishing.", 90),  # 1.5 minutes
        ("Political animals means we need community.", 180),  # 3 minutes (exploration)
        ("The highest good is happiness through virtue.", 360),  # 6 minutes (exploration)
        ("This connects to modern democracy.", 480),  # 8 minutes (synthesis)
        ("I see how ancient ideas shape today.", 570),  # 9.5 minutes (wrap-up)
    ]
    
    # Save original start time
    original_start = ai_service.sessions[session_id]['start_time']
    
    for message, seconds_elapsed in messages:
        # Manipulate start time to simulate time passing
        ai_service.sessions[session_id]['start_time'] = datetime.now() - timedelta(seconds=seconds_elapsed)
        
        print(f"\n📍 Time: {seconds_elapsed/60:.1f} minutes")
        print(f"Student: {message[:50]}...")
        
        response, metadata = ai_service.get_ai_response(session_id, message)
        
        print(f"AI Phase: {metadata['phase']}")
        print(f"AI Response: {response[:150]}...")
        print(f"Should wrap up: {metadata['should_wrap_up']}")
        
        # Verify phase matches expected time
        minutes = seconds_elapsed / 60.0
        expected_phase = (
            "opening" if minutes < 2 else
            "exploration" if minutes < 8 else
            "synthesis" if minutes < 9.5 else
            "wrap_up"
        )
        
        if metadata['phase'] == expected_phase:
            print(f"✅ Correct phase for {minutes:.1f} minutes")
        else:
            print(f"❌ Wrong phase! Expected {expected_phase}, got {metadata['phase']}")
    
    # Analyze conversation flow
    print(f"\n📊 Time-Based Analysis:")
    print("=" * 30)
    
    # Check if AI adapted its responses
    session_data = ai_service.sessions[session_id]
    history = session_data['conversation_history']
    
    # Look for phase-appropriate language
    opening_response = history[1]['content'] if len(history) > 1 else ""
    exploration_response = history[5]['content'] if len(history) > 5 else ""
    synthesis_response = history[9]['content'] if len(history) > 9 else ""
    
    print("\n🎯 Response Characteristics by Phase:")
    if "simple" in opening_response.lower() or "start" in opening_response.lower():
        print("✅ Opening: Uses accessible language")
    
    if "but" in exploration_response.lower() or "however" in exploration_response.lower():
        print("✅ Exploration: Includes challenges/counterpoints")
    
    if "modern" in synthesis_response.lower() or "today" in synthesis_response.lower():
        print("✅ Synthesis: Connects to contemporary themes")
    
    # Cleanup
    ai_service.cleanup_session(session_id)
    
    print(f"\n🏁 Time-based conversation test completed!")

if __name__ == "__main__":
    asyncio.run(test_time_based_phases())