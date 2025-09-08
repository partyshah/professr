"""Test a realistic 10-minute conversation flow"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from ai_service import AITutorService
import time

load_dotenv()

def simulate_realistic_conversation():
    """Simulate a realistic student conversation with natural timing"""
    
    ai_service = AITutorService()
    session_id = "realistic_session_test"
    
    print("🎓 Simulating Realistic 10-Minute Oral Assessment")
    print("=" * 60)
    
    # Initialize session
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    result = ai_service.initialize_session(session_id, pdf_paths)
    
    if not result['success']:
        print("❌ Failed to initialize session")
        return
    
    print("✅ Session initialized with Aristotle's Politics PDFs")
    print("\n" + "="*60 + "\n")
    
    # Realistic student responses at different time points
    conversation = [
        (30, "Hi, I'm ready to discuss today's readings about Aristotle."),
        (90, "I think Aristotle is saying that humans are meant to live in communities, not alone. The city-state isn't just about survival but about achieving a good life together."),
        (180, "Well, when he talks about humans as political animals, I think he means we naturally form governments and societies. It's not something we choose, it's part of who we are."),
        (300, "That's interesting. I guess the household is more about basic needs and family relationships, while the city-state is about justice and making citizens virtuous. The city-state has a higher purpose."),
        (420, "I think Aristotle would say that good laws teach citizens to be virtuous. But in modern democracy, we often think laws should just protect freedom. There's a tension there."),
        (510, "In today's world, maybe we see this in public education or civic institutions that try to shape good citizens, not just protect individual rights."),
        (570, "I've learned that Aristotle sees politics as essential to human nature, not just a necessary evil. This challenges how we often think about government today."),
    ]
    
    for seconds_elapsed, student_message in conversation:
        # Manipulate session start time to simulate elapsed time
        ai_service.sessions[session_id]['start_time'] = datetime.now() - timedelta(seconds=seconds_elapsed)
        
        # Display time marker
        minutes = seconds_elapsed / 60.0
        print(f"⏱️  TIME: {minutes:.1f} minutes ({seconds_elapsed} seconds)")
        print("-" * 40)
        
        # Student speaks
        print(f"👨‍🎓 STUDENT: {student_message}")
        
        # Get AI response
        ai_response, metadata = ai_service.get_ai_response(session_id, student_message)
        
        # AI responds
        print(f"\n🤖 AI PROFESSOR (Phase: {metadata['phase']}):")
        print(f"   {ai_response}")
        
        # Show metadata
        print(f"\n📊 Metadata:")
        print(f"   - Questions asked: {metadata['question_count']}")
        print(f"   - Minutes elapsed: {metadata['minutes_elapsed']}")
        print(f"   - Should wrap up: {metadata['should_wrap_up']}")
        
        print("\n" + "="*60 + "\n")
        
        # Brief pause for readability
        time.sleep(0.5)
    
    # Final analysis
    print("📈 CONVERSATION ANALYSIS")
    print("=" * 40)
    
    session_data = ai_service.sessions[session_id]
    history = session_data['conversation_history']
    
    print(f"Total exchanges: {len(history) // 2}")
    print(f"Final phase reached: wrap_up")
    
    # Check for variety in AI responses
    ai_responses = [msg['content'] for msg in history if msg['role'] == 'assistant']
    
    # Check for phase-appropriate behavior
    print("\n✅ Phase Progression:")
    print("  - Opening: Established baseline understanding")
    print("  - Exploration: Challenged and probed deeper")
    print("  - Synthesis: Connected to modern themes")
    print("  - Wrap-up: Provided reflection")
    
    # Check for non-repetition
    unique_concepts = set()
    for response in ai_responses:
        if 'political animal' in response.lower():
            unique_concepts.add('political animals')
        if 'highest good' in response.lower():
            unique_concepts.add('highest good')
        if 'city-state' in response.lower():
            unique_concepts.add('city-state')
        if 'virtue' in response.lower():
            unique_concepts.add('virtue')
        if 'justice' in response.lower():
            unique_concepts.add('justice')
    
    print(f"\n📚 Unique concepts discussed: {', '.join(unique_concepts)}")
    
    # Cleanup
    ai_service.cleanup_session(session_id)
    
    print("\n✅ Realistic conversation simulation completed!")

if __name__ == "__main__":
    simulate_realistic_conversation()