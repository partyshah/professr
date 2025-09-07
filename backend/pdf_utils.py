"""PDF text extraction utilities"""
import os
from typing import List, Dict
from PyPDF2 import PdfReader
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from a PDF file"""
    try:
        full_path = os.path.join("static/assignments", pdf_path)
        
        if not os.path.exists(full_path):
            logger.error(f"PDF file not found: {full_path}")
            return ""
        
        reader = PdfReader(full_path)
        text_content = []
        
        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text:
                text_content.append(f"[Page {page_num}]\n{text}")
        
        return "\n\n".join(text_content)
    
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
        return ""

def extract_texts_from_pdfs(pdf_paths: List[str]) -> Dict[str, str]:
    """Extract text from multiple PDFs"""
    extracted_texts = {}
    
    for pdf_path in pdf_paths:
        text = extract_text_from_pdf(pdf_path)
        if text:
            filename = os.path.basename(pdf_path)
            extracted_texts[filename] = text
    
    return extracted_texts

def format_pdf_context(pdf_texts: Dict[str, str]) -> str:
    """Format extracted PDF texts for system prompt context"""
    if not pdf_texts:
        return "No reading materials provided."
    
    formatted_sections = []
    for filename, content in pdf_texts.items():
        formatted_sections.append(f"=== {filename} ===\n{content}")
    
    return "\n\n".join(formatted_sections)