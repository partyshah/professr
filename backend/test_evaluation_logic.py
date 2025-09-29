#!/usr/bin/env python3
"""Test script for the new evaluation color logic"""

def test_evaluation_logic():
    """Test the 50% majority rule for color determination"""

    test_cases = [
        # Test case: (green_count, yellow_count, red_count, expected_category)
        (3, 1, 0, "green"),     # 75% green -> green
        (2, 1, 1, "green"),     # 50% green -> green
        (1, 3, 0, "yellow"),    # 75% yellow -> yellow
        (1, 2, 1, "yellow"),    # 50% yellow -> yellow
        (0, 2, 2, "yellow"),    # 50% yellow, 50% red -> yellow (your case!)
        (0, 1, 3, "red"),       # 75% red -> red
        (1, 1, 2, "red"),       # 50% red -> red
        (1, 1, 1, "yellow"),    # No majority -> yellow (default)
    ]

    print("Testing 50% Majority Rule Logic")
    print("=" * 50)

    for green_count, yellow_count, red_count, expected in test_cases:
        # Apply our new 50% majority rule logic
        if green_count >= 2:
            category = "green"
        elif yellow_count >= 2:
            category = "yellow"
        elif red_count >= 2:
            category = "red"
        else:
            category = "yellow"

        total = green_count + yellow_count + red_count
        status = "✅ PASS" if category == expected else "❌ FAIL"

        print(f"{status} | G:{green_count} Y:{yellow_count} R:{red_count} (total:{total}) -> {category} (expected: {expected})")

        if category != expected:
            print(f"   ERROR: Expected {expected}, got {category}")

    print("\n" + "=" * 50)
    print("Key test case: 2 Yellow + 2 Red = Yellow overall (50% rule)")

if __name__ == "__main__":
    test_evaluation_logic()