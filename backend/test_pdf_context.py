"""Test that both reading1 and reading2 PDFs are passed to the AI"""
import os
from dotenv import load_dotenv
from ai_service import AITutorService
from pdf_utils import extract_texts_from_pdfs, format_pdf_context

load_dotenv()

def test_pdf_context_loading():
    """Verify both PDFs are extracted and included in AI context"""
    
    print("📚 Testing PDF Context Loading")
    print("=" * 60)
    
    # First, let's directly test PDF extraction
    print("\n1. Testing Direct PDF Extraction")
    print("-" * 40)
    
    pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
    extracted_texts = extract_texts_from_pdfs(pdf_paths)
    
    print(f"✅ Extracted {len(extracted_texts)} PDFs:")
    for filename, content in extracted_texts.items():
        print(f"   - {filename}: {len(content)} characters")
        # Show first few distinctive words from each PDF
        first_words = content[:200].replace('\n', ' ')
        print(f"     Preview: {first_words}...")
    
    # Check for distinctive content from each PDF
    print("\n2. Checking for Distinctive Content")
    print("-" * 40)
    
    formatted_context = format_pdf_context(extracted_texts)
    
    # Look for unique markers from each PDF
    if "reading1.pdf" in formatted_context:
        print("✅ reading1.pdf header found in context")
    else:
        print("❌ reading1.pdf header missing!")
    
    if "reading2.pdf" in formatted_context:
        print("✅ reading2.pdf header found in context")
    else:
        print("❌ reading2.pdf header missing!")
    
    # Check for Aristotle content (reading1)
    if "ARISTOTLE" in formatted_context and "Politics" in formatted_context:
        print("✅ Aristotle's Politics content found (reading1)")
    else:
        print("❌ Aristotle content missing!")
    
    # Check for distinctive content from reading2
    # (We'll look for different patterns since we don't know reading2's exact content)
    reading2_start = formatted_context.find("=== reading2.pdf ===")
    if reading2_start > 0:
        reading2_content = formatted_context[reading2_start:reading2_start+500]
        print(f"✅ reading2.pdf content starts at position {reading2_start}")
        print(f"   Preview: {reading2_content[:200]}...")
    
    # Now test through AI service
    print("\n3. Testing PDF Context in AI Service")
    print("-" * 40)
    
    ai_service = AITutorService()
    session_id = "pdf_context_test"
    
    result = ai_service.initialize_session(session_id, pdf_paths)
    
    if result['success']:
        print(f"✅ Session initialized with {result['pdf_count']} PDFs")
    else:
        print(f"❌ Session initialization failed: {result}")
        return
    
    # Check what's stored in the session
    session_data = ai_service.sessions[session_id]
    pdf_context = session_data['pdf_context']
    
    print(f"\n4. Analyzing PDF Context in Session")
    print("-" * 40)
    print(f"Total context length: {len(pdf_context)} characters")
    
    # Count occurrences of each PDF marker
    reading1_count = pdf_context.count("reading1.pdf")
    reading2_count = pdf_context.count("reading2.pdf")
    
    print(f"reading1.pdf mentioned: {reading1_count} times")
    print(f"reading2.pdf mentioned: {reading2_count} times")
    
    # Test with a question that could reference content from both PDFs
    print("\n5. Testing AI Response with Both PDFs")
    print("-" * 40)
    
    test_message = "Can you mention something specific from each of the two readings we have for today?"
    
    response, metadata = ai_service.get_ai_response(session_id, test_message)
    
    print(f"Student: {test_message}")
    print(f"\nAI Response: {response}")
    
    # Check if AI acknowledges multiple readings
    if "both" in response.lower() or "two" in response.lower() or "readings" in response.lower():
        print("\n✅ AI acknowledges multiple readings")
    else:
        print("\n⚠️ AI might not be aware of multiple readings")
    
    # Test with specific question about reading2
    print("\n6. Testing Specific Reference to Second Reading")
    print("-" * 40)
    
    test_message2 = "Besides Aristotle's Politics in the first reading, what concepts are covered in our second reading?"
    
    response2, metadata2 = ai_service.get_ai_response(session_id, test_message2)
    
    print(f"Student: {test_message2}")
    print(f"\nAI Response: {response2}")
    
    # Final analysis
    print("\n📊 FINAL ANALYSIS")
    print("=" * 40)
    
    if reading1_count > 0 and reading2_count > 0 and len(pdf_context) > 50000:
        print("✅ BOTH PDFs are successfully loaded and passed to the AI")
        print(f"   - reading1.pdf: Loaded")
        print(f"   - reading2.pdf: Loaded")
        print(f"   - Combined context: {len(pdf_context)} characters")
        print(f"   - AI has access to both readings")
    else:
        print("❌ Issue detected with PDF loading")
        if reading1_count == 0:
            print("   - reading1.pdf not properly loaded")
        if reading2_count == 0:
            print("   - reading2.pdf not properly loaded")
    
    # Cleanup
    ai_service.cleanup_session(session_id)

if __name__ == "__main__":
    test_pdf_context_loading()