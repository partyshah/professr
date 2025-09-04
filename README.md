# Production Web App

Mono-repo structure for React frontend and FastAPI backend.

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Health check: http://localhost:8000/healthz

Note: Activate the virtual environment (`source venv/bin/activate`) each time you open a new terminal for backend work.