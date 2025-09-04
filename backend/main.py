import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
from dotenv import load_dotenv

from database import get_db
from models import Student, Assignment, Session

load_dotenv()

app = FastAPI(title="Backend API")

# Request models
class Turn(BaseModel):
    speaker: str
    text: str

class SessionSubmission(BaseModel):
    student_id: int
    assignment_id: int
    transcript: List[Turn]
    duration_seconds: int

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add production frontend URL if set
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

@app.post("/seed-data")
async def seed_data(db: DBSession = Depends(get_db)):
    """Create sample students and assignments for testing"""
    try:
        # Check if data already exists
        existing_students = db.query(Student).first()
        if existing_students:
            return {"status": "Data already seeded"}
        
        # Create students
        students = [
            Student(name="Alice Johnson"),
            Student(name="Bob Smith"),
            Student(name="Carol Davis"),
            Student(name="David Wilson"),
            Student(name="Emma Brown"),
        ]
        for student in students:
            db.add(student)
        db.commit()
        
        # Create assignments
        assignments = [
            Assignment(
                title="Poetry Analysis",
                description="Analyze the themes and literary devices in the provided poem"
            ),
            Assignment(
                title="Historical Event Discussion",
                description="Discuss the causes and effects of the American Revolution"
            ),
            Assignment(
                title="Scientific Method",
                description="Explain how you would design an experiment to test plant growth"
            ),
            Assignment(
                title="Character Analysis",
                description="Analyze the main character's development in To Kill a Mockingbird"
            ),
            Assignment(
                title="Current Events",
                description="Discuss a recent news story and its broader implications"
            ),
        ]
        for assignment in assignments:
            db.add(assignment)
        db.commit()
        
        return {
            "status": "success",
            "students_created": len(students),
            "assignments_created": len(assignments)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error seeding data: {str(e)}")

@app.get("/students")
async def get_students(db: DBSession = Depends(get_db)):
    """Get all students for dropdown selection"""
    try:
        students = db.query(Student).all()
        return {"students": [{"id": s.id, "name": s.name} for s in students]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching students: {str(e)}")

@app.get("/assignments")
async def get_assignments(db: DBSession = Depends(get_db)):
    """Get all assignments for dropdown selection"""
    try:
        assignments = db.query(Assignment).all()
        return {"assignments": [
            {"id": a.id, "title": a.title, "description": a.description} 
            for a in assignments
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")

@app.post("/sessions")
async def submit_session(submission: SessionSubmission, db: DBSession = Depends(get_db)):
    """Submit a completed assessment session"""
    try:
        # For now, allow multiple attempts (no duplicate check)
        
        # Create new session
        new_session = Session(
            student_id=submission.student_id,
            assignment_id=submission.assignment_id,
            status="completed",
            started_at=datetime.now(),
            completed_at=datetime.now(),
            full_transcript=[turn.dict() for turn in submission.transcript],
            final_score=85,  # Mock score for now
            score_category="green",  # Mock category
            ai_feedback="Good analysis with clear examples. Consider exploring counterarguments more deeply."  # Mock feedback
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return {
            "session_id": new_session.id,
            "score": new_session.final_score,
            "score_category": new_session.score_category,
            "feedback": new_session.ai_feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting session: {str(e)}")

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: DBSession = Depends(get_db)):
    """Delete a session by ID"""
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        db.delete(session)
        db.commit()
        
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")

@app.get("/test-data")
async def get_test_data(db: DBSession = Depends(get_db)):
    try:
        # Get all sessions with student and assignment names
        sessions = db.query(Session).all()
        
        result = []
        for session in sessions:
            student = db.query(Student).filter(Student.id == session.student_id).first()
            assignment = db.query(Assignment).filter(Assignment.id == session.assignment_id).first()
            
            result.append({
                "session_id": session.id,
                "student_name": student.name if student else "Unknown",
                "assignment_title": assignment.title if assignment else "Unknown",
                "status": session.status,
                "final_score": session.final_score,
                "score_category": session.score_category,
                "transcript": session.full_transcript,
                "ai_feedback": session.ai_feedback,
                "completed_at": session.completed_at
            })
        
        return {"sessions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching test data: {str(e)}")