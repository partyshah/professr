"""Script to update assignments with PDF paths"""
import os
import sys
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Assignment

def update_assignment_pdfs():
    """Update assignments with PDF paths for week1"""
    
    db = Session(engine)
    
    try:
        # Get all assignments
        assignments = db.query(Assignment).all()
        
        print("Current assignments in database:")
        for a in assignments:
            print(f"  ID: {a.id}, Title: {a.title}")
        
        # Update the first assignment (or specific one based on title)
        # Assuming we want to update the first assignment with week1 PDFs
        if assignments:
            assignment = assignments[0]  # Get first assignment
            
            # Update with the PDF paths
            assignment.week_number = 1
            assignment.pdf_paths = ["week1/reading1.pdf", "week1/reading2.pdf"]
            assignment.solution_pdf_paths = []  # No solutions for now
            
            db.commit()
            print(f"\nUpdated assignment ID {assignment.id} ({assignment.title}) with:")
            print(f"  - PDF paths: {assignment.pdf_paths}")
            print(f"  - Week number: {assignment.week_number}")
        else:
            print("\nNo assignments found in database. Please seed the database first.")
            
    except Exception as e:
        print(f"Error updating assignments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_assignment_pdfs()