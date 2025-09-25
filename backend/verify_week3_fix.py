"""Comprehensive test to verify Week 3 references correct content"""

def verify_fixes():
    """Verify all fixes are in place"""

    print("=" * 70)
    print("VERIFYING WEEK 3 FIX - COMPREHENSIVE CHECK")
    print("=" * 70)

    issues_found = []

    # 1. Check prompts.py
    print("\n1. Checking prompts.py...")
    with open('prompts.py', 'r') as f:
        prompts_content = f.read()

    # Check for removed hardcoded names
    bad_examples = ['Aristotle says the city', 'Locke says government', 'Jefferson says all men']
    for ex in bad_examples:
        if ex in prompts_content:
            issues_found.append(f"prompts.py still has: '{ex}'")

    # Check for critical instruction
    if "CRITICAL INSTRUCTION: Use ONLY the Provided Readings" not in prompts_content:
        issues_found.append("prompts.py missing critical instruction")
    else:
        print("   ✅ Critical instruction present")

    if "[AUTHOR from the reading]" in prompts_content:
        print("   ✅ Generic placeholders in place")
    else:
        issues_found.append("prompts.py missing generic placeholders")

    # 2. Check conversation_manager.py
    print("\n2. Checking conversation_manager.py...")
    with open('conversation_manager.py', 'r') as f:
        conv_content = f.read()

    # Check for removed Aristotle references
    aristotle_refs = ["'highest good'", "'political animal'", "'city-state'",
                      "highest good and happiness", "political animals concept",
                      "city-state definition"]

    for ref in aristotle_refs:
        if ref in conv_content:
            issues_found.append(f"conversation_manager.py still has: {ref}")

    if not any(ref in conv_content for ref in aristotle_refs):
        print("   ✅ Hardcoded Aristotle references removed")

    # Check that ai_phrases_used is removed
    if "ai_phrases_used = set()" in conv_content:
        issues_found.append("conversation_manager.py still has ai_phrases_used variable")
    else:
        print("   ✅ Unused ai_phrases_used variable removed")

    # 3. Verify Week 3 PDF exists
    print("\n3. Checking Week 3 PDF...")
    import os
    week3_path = "static/assignments/week3/reading1.pdf"
    if os.path.exists(week3_path):
        print(f"   ✅ Week 3 PDF exists at {week3_path}")
        print(f"   📚 Size: {os.path.getsize(week3_path) / (1024*1024):.1f} MB")
    else:
        issues_found.append(f"Week 3 PDF not found at {week3_path}")

    # 4. Summary
    print("\n" + "=" * 70)
    if issues_found:
        print("❌ ISSUES FOUND:")
        for issue in issues_found:
            print(f"   - {issue}")
    else:
        print("✅ ALL CHECKS PASSED!")
        print("\nThe AI should now:")
        print("1. Read the actual Week 3 content (American Revolution)")
        print("2. Ask questions about the Stamp Act, British colonialism, NY's reluctance")
        print("3. NOT default to Aristotle or other hardcoded philosophers")
        print("\nThe fix addresses:")
        print("- Removed hardcoded philosopher names from prompt examples")
        print("- Added clear instructions to use only provided readings")
        print("- Removed Aristotle-specific concept tracking from conversation manager")

    print("=" * 70)

if __name__ == "__main__":
    verify_fixes()