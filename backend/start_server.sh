#!/bin/bash

# Start the FastAPI backend server with single worker to maintain session state
# This ensures that AI tutoring sessions stored in memory remain accessible

echo "Starting FastAPI backend server with single worker..."
echo "Session data will be stored in memory and persist across requests"
echo "Health check: http://localhost:8000/healthz"
echo "API docs: http://localhost:8000/docs"
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Warning: Virtual environment not found. Please run 'python3 -m venv venv' first."
    exit 1
fi

# Start server with single worker
uvicorn main:app --reload --port 8000 --workers 1