"""Validate that the prompts have been updated correctly"""

def check_prompt_updates():
    """Check that prompts no longer have hardcoded philosopher names in questions"""

    with open('prompts.py', 'r') as f:
        content = f.read()

    print("=" * 60)
    print("VALIDATING PROMPT UPDATES")
    print("=" * 60)

    # Check for critical instruction
    if "CRITICAL INSTRUCTION: Use ONLY the Provided Readings" in content:
        print("✅ Critical instruction added to use only provided readings")
    else:
        print("❌ Missing critical instruction")

    # Check for warning about examples
    if "These are ONLY formatting examples" in content:
        print("✅ Warning added that examples are just formatting")
    else:
        print("❌ Missing warning about examples")

    # Check that Aristotle examples are replaced with placeholders
    example_section = content[content.find("Sample Conversational Questions"):content.find("## Goal")]

    old_examples = [
        '"Aristotle says the city',
        '"He calls humans',
        '"Locke says government',
        '"Jefferson says all men',
        '"MLK says an unjust',
        'Du Bois talks about'
    ]

    found_old = []
    for ex in old_examples:
        if ex in example_section:
            found_old.append(ex)

    if found_old:
        print(f"❌ Still has old hardcoded examples: {found_old[:2]}...")
    else:
        print("✅ Old hardcoded philosopher examples removed")

    # Check for new placeholder format
    placeholders = ["[AUTHOR", "[CONCEPT", "[THEORIST", "[SPECIFIC IDEA"]
    found_placeholders = []
    for p in placeholders:
        if p in example_section:
            found_placeholders.append(p)

    if found_placeholders:
        print(f"✅ New placeholder format found: {found_placeholders[:3]}...")
    else:
        print("❌ Missing new placeholder format")

    # Check evaluation prompt
    if "Aristotle and Locke but only in broad terms" in content:
        print("❌ Evaluation still mentions Aristotle and Locke")
    else:
        print("✅ Evaluation prompt updated to remove specific names")

    print("\n" + "=" * 60)
    print("SUMMARY:")

    if "[AUTHOR" in example_section and "CRITICAL INSTRUCTION" in content:
        print("✅ SUCCESS: Prompts have been properly updated!")
        print("   - Examples now use generic placeholders")
        print("   - Clear instructions to use only provided readings")
        print("   - AI should now reference Week 3 content, not Aristotle")
    else:
        print("⚠️ PARTIAL: Some updates made but may need review")

    print("=" * 60)

if __name__ == "__main__":
    check_prompt_updates()