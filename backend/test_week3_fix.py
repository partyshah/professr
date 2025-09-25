"""Test script to verify Week 3 readings are properly referenced"""
import sys
import os
sys.path.append('.')
from ai_service import AITutorService
import logging

logging.basicConfig(level=logging.INFO)

def test_week3_assessment():
    """Test that AI properly references Week 3 content, not example philosophers"""

    ai_service = AITutorService()
    session_id = "test_week3_session"

    # Initialize with Week 3 PDFs
    print("\n1. Initializing session with Week 3 PDF...")
    pdf_paths = ["week3/reading1.pdf"]
    result = ai_service.initialize_session(session_id, pdf_paths)

    if not result['success']:
        print(f"❌ Failed to initialize: {result}")
        return

    print(f"✅ Session initialized with Week 3 PDFs")

    # Test conversation
    print("\n2. Testing AI responses to ensure they reference actual Week 3 content...")

    # First message
    response1, metadata1 = ai_service.get_ai_response(
        session_id,
        "Hi, I'm ready to discuss this week's readings."
    )

    print(f"\nAI Response 1:\n{response1}")

    # Check if response mentions generic philosophers from examples
    wrong_refs = ["Aristotle", "Locke", "Jefferson", "MLK", "Du Bois", "Hobbes"]
    issues = []
    for ref in wrong_refs:
        if ref.lower() in response1.lower():
            issues.append(ref)

    if issues:
        print(f"\n⚠️ WARNING: AI mentioned example philosophers not in Week 3: {issues}")
        print("The AI should only reference content from the actual Week 3 PDF!")
    else:
        print(f"\n✅ Good! AI did not mention example philosophers")

    # Second message to see follow-up
    response2, metadata2 = ai_service.get_ai_response(
        session_id,
        "I think the main ideas in the reading relate to how societies organize themselves and the role of institutions."
    )

    print(f"\nAI Response 2:\n{response2}")

    # Check second response
    issues2 = []
    for ref in wrong_refs:
        if ref.lower() in response2.lower():
            issues2.append(ref)

    if issues2:
        print(f"\n⚠️ WARNING: AI still mentioning example philosophers: {issues2}")
    else:
        print(f"\n✅ Good! AI focused on actual reading content")

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY:")
    if not issues and not issues2:
        print("✅ SUCCESS: AI is properly referencing Week 3 content only")
    else:
        print("⚠️ ISSUE: AI is still using example philosophers instead of actual reading content")
        print("The prompt changes may need further refinement.")
    print("="*60)

if __name__ == "__main__":
    test_week3_assessment()