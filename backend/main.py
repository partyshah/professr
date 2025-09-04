import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
from dotenv import load_dotenv

from database import get_db
from models import Student, Assignment, Session

load_dotenv()

app = FastAPI(title="Backend API")

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

@app.post("/test-data")
async def create_test_data(db: DBSession = Depends(get_db)):
    try:
        # Create test student
        student = Student(name="John Doe")
        db.add(student)
        db.commit()
        db.refresh(student)
        
        # Create test assignment  
        assignment = Assignment(
            title="Poetry Analysis", 
            description="Analyze a poem and discuss its themes"
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        
        # Create test session
        test_transcript = [
            {"speaker": "student", "text": "I think this poem is about love and loss"},
            {"speaker": "ai", "text": "That's an interesting interpretation. Can you elaborate on the specific imagery that suggests loss?"},
            {"speaker": "student", "text": "The author mentions wilted flowers and empty rooms"},
            {"speaker": "ai", "text": "Excellent observation. How does that imagery connect to the overall theme?"}
        ]
        
        session = Session(
            student_id=student.id,
            assignment_id=assignment.id,
            status="completed",
            started_at=datetime.now(),
            completed_at=datetime.now(),
            full_transcript=test_transcript,
            final_score=85,
            score_category="green",
            ai_feedback="Strong analysis with good textual evidence. Consider exploring more complex themes."
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "status": "success",
            "student_id": student.id,
            "assignment_id": assignment.id,
            "session_id": session.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating test data: {str(e)}")

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