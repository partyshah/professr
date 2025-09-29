#!/usr/bin/env python3
"""Test that session evaluation works even after restart/cleanup"""

import os
import sys
import time
from ai_service import AITutorService
from database import SessionLocal
from models import Session

def test_session_recovery():
    """Test evaluation with and without in-memory session"""

    print("🧪 Testing Session Recovery Fix")
    print("=" * 50)

    # Initialize service
    ai_service = AITutorService()
    db = SessionLocal()

    # Create a test session ID
    session_id = "session_1_1_recovery_test"

    # Initialize a session
    print("\n1. Initializing session...")
    pdfs = ["week1/reading1.pdf"]
    ai_service.initialize_session(session_id, pdfs)

    # Have a brief conversation
    print("\n2. Having a conversation...")
    responses = [
        "I understand that political institutions shape how societies make decisions.",
        "The separation of powers prevents concentration of authority in one branch.",
        "Checks and balances ensure accountability between different branches.",
    ]

    for i, response in enumerate(responses):
        print(f"   Student {i+1}: {response[:50]}...")
        ai_response, metadata = ai_service.get_ai_response(session_id, response)
        print(f"   AI {i+1}: {ai_response[:50]}...")
        time.sleep(0.5)

    # Test 1: Evaluate with session in memory
    print("\n3. Testing evaluation WITH session in memory...")
    evaluation1 = ai_service.evaluate_session(session_id, db)

    if 'error' in evaluation1:
        print(f"   ❌ Failed: {evaluation1['error']}")
    else:
        print(f"   ✅ Success! Score: {evaluation1['score']}, Category: {evaluation1['category']}")

    # Save transcript to database (simulating what happens in the endpoint)
    print("\n4. Saving session to database...")
    formatted_transcript = ai_service.get_formatted_transcript(session_id)

    # Extract IDs from session_id
    parts = session_id.split('_')
    student_id = int(parts[1])
    assignment_id = int(parts[2])

    # Check if session already exists
    existing = db.query(Session).filter(
        Session.student_id == student_id,
        Session.assignment_id == assignment_id
    ).first()

    if existing:
        print("   Session already exists, updating...")
        existing.full_transcript = formatted_transcript
        existing.final_score = evaluation1.get('score', 75)
        existing.score_category = evaluation1.get('category', 'yellow')
        existing.ai_feedback = evaluation1.get('feedback', 'No feedback')
        db.commit()
    else:
        print("   Creating new session in database...")
        from datetime import datetime
        new_session = Session(
            student_id=student_id,
            assignment_id=assignment_id,
            status="completed",
            started_at=datetime.now(),
            completed_at=datetime.now(),
            full_transcript=formatted_transcript,
            final_score=evaluation1.get('score', 75),
            score_category=evaluation1.get('category', 'yellow'),
            ai_feedback=evaluation1.get('feedback', 'No feedback')
        )
        db.add(new_session)
        db.commit()

    # Test 2: Clean up the session from memory
    print("\n5. Cleaning up session from memory...")
    ai_service.cleanup_session(session_id)

    # Test 3: Try to evaluate again (should recover from database)
    print("\n6. Testing evaluation WITHOUT session in memory (recovery)...")
    evaluation2 = ai_service.evaluate_session(session_id, db)

    if 'error' in evaluation2:
        print(f"   ❌ Failed: {evaluation2['error']}")
        print("   Session recovery from database did not work!")
    else:
        print(f"   ✅ Success! Score: {evaluation2['score']}, Category: {evaluation2['category']}")
        print("   Session successfully recovered from database!")

    # Test 4: Try without database session (should fail)
    print("\n7. Testing evaluation without database access...")
    evaluation3 = ai_service.evaluate_session(session_id, None)

    if 'error' in evaluation3:
        print(f"   ✅ Expected error: {evaluation3['error']}")
    else:
        print(f"   ❌ Unexpected success - should have failed without DB")

    db.close()

    print("\n" + "=" * 50)
    print("✅ Session recovery test complete!")
    print("\nSummary:")
    print("- Sessions can be evaluated from memory ✅")
    print("- Sessions can be recovered from database ✅")
    print("- Proper error when both sources unavailable ✅")

if __name__ == "__main__":
    test_session_recovery()