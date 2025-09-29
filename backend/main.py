import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
from dotenv import load_dotenv
import openai
from database import get_db
from models import Student, Assignment, Session
from ai_service import AITutorService

load_dotenv()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize AI Tutor Service
ai_service = AITutorService()

app = FastAPI(title="Backend API")

# Mount static files for serving PDFs
app.mount("/static", StaticFiles(directory="static"), name="static")

# Request models
class Turn(BaseModel):
    speaker: str
    text: str


# New AI conversation models
class StartSessionRequest(BaseModel):
    student_id: int
    assignment_id: int

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://prod-heather-frontend.onrender.com",  # Production frontend
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
    expose_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

@app.get("/debug-cors")
async def debug_cors():
    return {
        "allowed_origins": origins,
        "frontend_url_env": os.getenv("FRONTEND_URL"),
        "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
        "elevenlabs_key_set": bool(os.getenv("ELEVENLABS_API_KEY"))
    }

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

@app.get("/check-session")
async def check_session(student_id: int, assignment_id: int, db: DBSession = Depends(get_db)):
    """Check if a student has already completed an assignment"""
    try:
        existing_session = db.query(Session).filter(
            Session.student_id == student_id,
            Session.assignment_id == assignment_id,
            Session.status == "completed"  # Only count completed sessions
        ).first()
        
        if existing_session:
            return {
                "exists": True,
                "session_id": existing_session.id,
                "completed_at": existing_session.completed_at,
                "score": existing_session.final_score
            }
        else:
            return {"exists": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking session: {str(e)}")

@app.get("/assignments")
async def get_assignments(db: DBSession = Depends(get_db)):
    """Get all assignments for dropdown selection"""
    try:
        assignments = db.query(Assignment).all()
        return {"assignments": [
            {
                "id": a.id, 
                "title": a.title, 
                "description": a.description,
                "week_number": a.week_number,
                "pdf_urls": [f"/static/assignments/{path}" for path in a.pdf_paths] if a.pdf_paths else [],
                "solution_pdf_urls": [f"/static/assignments/{path}" for path in a.solution_pdf_paths] if a.solution_pdf_paths else [],
                "has_reading_text": bool(a.reading_text)
            } 
            for a in assignments
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")


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

@app.post("/speech-to-text")
async def speech_to_text(audio_file: UploadFile = File(...)):
    """Convert audio to text using OpenAI Whisper"""
    try:
        # Read the audio file
        audio_content = await audio_file.read()
        
        # Create a temporary file-like object for OpenAI
        from io import BytesIO
        audio_buffer = BytesIO(audio_content)
        audio_buffer.name = audio_file.filename
        
        # Send to Whisper
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_buffer
        )
        
        return {"transcript": transcript.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech-to-text error: {str(e)}")

# New AI Tutoring Endpoints
@app.post("/start-ai-session")
async def start_ai_session(request: StartSessionRequest, db: DBSession = Depends(get_db)):
    """Start a new AI tutoring session with PDF context"""
    try:
        # Get assignment and its PDFs or reading text
        assignment = db.query(Assignment).filter(Assignment.id == request.assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Create session ID
        session_id = f"session_{request.student_id}_{request.assignment_id}_{int(datetime.now().timestamp())}"

        # Initialize AI service with reading text if available, otherwise use PDFs
        if assignment.reading_text:
            result = ai_service.initialize_session_with_text(session_id, assignment.reading_text)
        elif assignment.pdf_paths:
            result = ai_service.initialize_session(session_id, assignment.pdf_paths)
        else:
            raise HTTPException(status_code=400, detail="Assignment has no reading material")
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return {
            "session_id": session_id,
            "assignment_title": assignment.title,
            "pdf_count": result.get('pdf_count', 0),
            "text_length": result.get('text_length', 0),
            "using_text": bool(assignment.reading_text),
            "message": "Session started. How would you like to begin discussing today's readings?"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting AI session: {str(e)}")

@app.post("/ai-chat")
async def ai_chat(request: ChatMessageRequest):
    """Send a message to the AI tutor and get a response"""
    try:
        ai_response, metadata = ai_service.get_ai_response(request.session_id, request.message)
        
        return {
            "response": ai_response,
            "question_count": metadata.get('question_count', 0),
            "phase": metadata.get('phase', 'unknown'),
            "should_wrap_up": metadata.get('should_wrap_up', False),
            "final_question": metadata.get('final_question', False),
            "auto_end": metadata.get('auto_end', False),
            "elapsed_seconds": metadata.get('elapsed_seconds', 0),
            "minutes_elapsed": metadata.get('minutes_elapsed', 0),
            "remaining_seconds": metadata.get('remaining_seconds', 0),
            "token_usage": metadata.get('token_usage', {}),
            "session_id": request.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

@app.post("/evaluate-ai-session")
async def evaluate_ai_session(session_id: str, db: DBSession = Depends(get_db)):
    """Evaluate a completed AI session and save to database"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Starting evaluation for session {session_id}")

    try:
        # Get evaluation from AI service (pass db session for recovery)
        evaluation = ai_service.evaluate_session(session_id, db)
        
        if 'error' in evaluation:
            raise HTTPException(status_code=400, detail=evaluation['error'])
        
        # Extract session info from session_id
        try:
            parts = session_id.split('_')
            student_id = int(parts[1])
            assignment_id = int(parts[2])
        except:
            raise HTTPException(status_code=400, detail="Invalid session ID format")
        
        # Get session stats
        stats = ai_service.get_session_stats(session_id)
        
        # Get the formatted transcript for database storage
        formatted_transcript = ai_service.get_formatted_transcript(session_id)
        
        # Create session record in database
        new_session = Session(
            student_id=student_id,
            assignment_id=assignment_id,
            status="completed",
            started_at=datetime.now(),
            completed_at=datetime.now(),
            full_transcript=formatted_transcript,
            final_score=evaluation.get('score', 75),
            score_category=evaluation.get('category', 'yellow'),
            ai_feedback=evaluation.get('feedback', 'No feedback available')
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        # Don't clean up AI session immediately - keep it for potential re-evaluation
        # ai_service.cleanup_session(session_id)
        logger.info(f"Session {session_id} evaluation complete - keeping in memory for potential re-access")
        
        return {
            "session_id": new_session.id,
            "score": evaluation.get('score'),
            "category": evaluation.get('category'),
            "feedback": evaluation.get('feedback'),
            "question_count": evaluation.get('question_count')
        }
        
    except Exception as e:
        logger.error(f"Error evaluating session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error evaluating session: {str(e)}")

@app.post("/ai-response")
async def get_ai_response(request: dict):
    """Get AI professor response using GPT-5"""
    try:
        assignment_title = request.get("assignment_title", "")
        transcript = request.get("transcript", [])
        current_student_input = request.get("current_input", "")
        
        # Build conversation context
        conversation_context = ""
        for turn in transcript:
            speaker = "Student" if turn["speaker"] == "student" else "AI Professor"
            conversation_context += f"{speaker}: {turn['text']}\n"
        
        # Add current student input
        conversation_context += f"Student: {current_student_input}\n"
        
        # System prompt
        system_prompt = f"""You are an AI professor conducting an oral assessment with a student on the topic: "{assignment_title}". 

Your role is to:
- Ask thoughtful follow-up questions about their responses
- Encourage deeper analysis and critical thinking  
- Provide gentle guidance without giving away answers
- Keep the conversation focused on the assignment topic
- Maintain an encouraging, academic tone
- Keep responses concise (1-2 sentences) to maintain conversation flow
- Build upon what the student has already said in this conversation

This is a {assignment_title} discussion. Guide the student to demonstrate their understanding through dialogue."""

        # Make GPT call
        response = client.chat.completions.create(
            model="gpt-4",  # Will update to gpt-5 when available
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": conversation_context}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        return {"response": ai_response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI response error: {str(e)}")

@app.post("/text-to-speech")
async def text_to_speech(request: dict):
    """Convert text to speech using ElevenLabs"""
    try:
        text = request.get("text", "")
        voice_id = os.getenv("ELEVENLABS_VOICE_ID")
        
        if not voice_id:
            raise HTTPException(status_code=500, detail="ElevenLabs voice ID not configured")
        
        # Generate speech - try different ElevenLabs API approach
        try:
            print(f"Text to convert: '{text}'")
            print(f"Using voice ID: {voice_id}")
            
            # Try the direct API approach instead of the client
            import requests
            
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": os.getenv("ELEVENLABS_API_KEY")
            }
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5
                }
            }
            
            print("Making ElevenLabs API request...")
            response = requests.post(url, json=data, headers=headers)
            print(f"ElevenLabs response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"ElevenLabs error response: {response.text}")
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
            
            audio_bytes = response.content
            print(f"Generated audio bytes length: {len(audio_bytes)}")
            
            if len(audio_bytes) < 1000:  # Suspiciously small
                raise Exception(f"Audio too small: {len(audio_bytes)} bytes")
                
        except Exception as e:
            print(f"ElevenLabs error: {str(e)}")
            raise Exception(f"ElevenLabs generation failed: {str(e)}")
        
        from fastapi.responses import Response
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech error: {str(e)}")

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