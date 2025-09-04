import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import Ping

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

@app.get("/db-ping")
async def db_ping(db: Session = Depends(get_db)):
    try:
        # Create a new ping record
        new_ping = Ping(message=f"Database ping at {datetime.now()}")
        db.add(new_ping)
        db.commit()
        db.refresh(new_ping)
        
        # Read back the latest ping
        latest_ping = db.query(Ping).order_by(Ping.id.desc()).first()
        
        return {
            "status": "database_healthy",
            "ping_id": latest_ping.id,
            "message": latest_ping.message,
            "created_at": latest_ping.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")