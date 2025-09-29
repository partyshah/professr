"""Test if PDF extraction is actually working"""
import os
import sys
from PyPDF2 import PdfReader

def test_pdf_extraction():
    """Test PDF extraction for Week 3"""

    pdf_path = "static/assignments/week3/reading1.pdf"

    print("=" * 70)
    print("TESTING PDF EXTRACTION FOR WEEK 3")
    print("=" * 70)

    # Check if file exists
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found at: {pdf_path}")
        return

    print(f"✅ PDF found at: {pdf_path}")
    print(f"   Size: {os.path.getsize(pdf_path) / (1024*1024):.1f} MB")

    # Try to extract text
    try:
        reader = PdfReader(pdf_path)
        print(f"   Pages: {len(reader.pages)}")

        # Extract text from first few pages
        extracted_text = ""
        for i in range(min(3, len(reader.pages))):
            page_text = reader.pages[i].extract_text()
            extracted_text += f"\n\n[PAGE {i+1}]\n{page_text}"

        # Check what we got
        if extracted_text.strip():
            print("\n✅ TEXT EXTRACTION SUCCESSFUL!")
            print("\nFirst 1000 characters:")
            print("-" * 40)
            print(extracted_text[:1000])
            print("-" * 40)

            # Check for key terms
            print("\nContent Analysis:")
            if "Aristotle" in extracted_text:
                print("   ⚠️  Contains 'Aristotle'")
            else:
                print("   ✅ Does NOT contain 'Aristotle'")

            if "Stamp Act" in extracted_text or "British" in extracted_text:
                print("   ✅ Contains American Revolution content")

            if "New York" in extracted_text:
                print("   ✅ Contains New York references")

            # Save full text for inspection
            with open("week3_extracted.txt", "w") as f:
                f.write(extracted_text)
            print(f"\n💾 Full extracted text saved to week3_extracted.txt")

        else:
            print("\n❌ EXTRACTION FAILED - No text extracted!")
            print("   This might be a scanned PDF without text layer")

    except Exception as e:
        print(f"\n❌ ERROR during extraction: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_extraction()