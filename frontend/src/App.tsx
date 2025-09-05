import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Session from './Session'
import SpeechSession from './SpeechSession'
import Results from './Results'
import Instructor from './Instructor'

interface Student {
  id: number
  name: string
}

interface Assignment {
  id: number
  title: string
  description: string
}

type AppView = 'selection' | 'session' | 'results'

// Create a separate component for the student flow
function StudentFlow() {
  const [currentView, setCurrentView] = useState<AppView>('selection')
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedAssignment, setSelectedAssignment] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [sessionTranscript, setSessionTranscript] = useState<any[]>([])
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [existingSessionData, setExistingSessionData] = useState<any>(null)
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  useEffect(() => {
    // Load students and assignments on mount
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Seed data if needed
      await fetch(`${apiUrl}/seed-data`, { method: 'POST' })
      
      // Fetch students
      const studentsResponse = await fetch(`${apiUrl}/students`)
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.students)
      
      // Fetch assignments
      const assignmentsResponse = await fetch(`${apiUrl}/assignments`)
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments)
    } catch (error) {
      setMessage('Error loading data')
    }
  }

  useEffect(() => {
    // Check if both selections are made
    setIsReady(selectedStudent !== '' && selectedAssignment !== '')
    
    // Reset existing session data when selections change
    setExistingSessionData(null)
    
    // Check for existing session when both are selected
    if (selectedStudent && selectedAssignment) {
      checkExistingSession()
    }
  }, [selectedStudent, selectedAssignment])
  
  const checkExistingSession = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/check-session?student_id=${selectedStudent}&assignment_id=${selectedAssignment}`
      )
      const data = await response.json()
      
      if (data.exists) {
        setExistingSessionData(data)
        setShowCompletedModal(true)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
  }

  const handleStartSession = () => {
    if (!isReady) return
    
    // Don't start if session already exists
    if (existingSessionData?.exists) {
      setShowCompletedModal(true)
      return
    }
    
    setCurrentView('session')
  }

  const handleSessionComplete = async (transcript: any[]) => {
    setSessionTranscript(transcript)
    
    // Submit to backend
    try {
      const response = await fetch(`${apiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: parseInt(selectedStudent),
          assignment_id: parseInt(selectedAssignment),
          transcript: transcript,
          duration_seconds: 600 - transcript.length * 15 // Mock duration calculation
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        setCurrentView('selection')
      } else {
        // Store the score and feedback from backend
        sessionStorage.setItem('lastScore', data.score)
        sessionStorage.setItem('lastScoreCategory', data.score_category)
        sessionStorage.setItem('lastFeedback', data.feedback)
        setCurrentView('results')
      }
    } catch (error) {
      alert('Error submitting session')
      setCurrentView('results') // Still show results even if submission failed
    }
  }

  const handleBackToHome = () => {
    setCurrentView('selection')
    setSelectedStudent('')
    setSelectedAssignment('')
    setSessionTranscript([])
  }

  const student = students.find(s => s.id === parseInt(selectedStudent))
  const assignment = assignments.find(a => a.id === parseInt(selectedAssignment))

  return (
    <>
      <h1>Oral Assessment Tool</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Link 
          to="/instructor"
          style={{ 
            color: '#666', 
            fontSize: '14px',
            textDecoration: 'none'
          }}
        >
          Instructor Access
        </Link>
      </div>
      
      {currentView === 'selection' && (
        <div className="card">
          <h2>Start Assessment</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="student-select" style={{ display: 'block', marginBottom: '5px' }}>
              1. Select your name:
            </label>
            <select 
              id="student-select"
              value={selectedStudent} 
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            >
              <option value="">-- Choose Student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="assignment-select" style={{ display: 'block', marginBottom: '5px' }}>
              2. Select assignment:
            </label>
            <select 
              id="assignment-select"
              value={selectedAssignment} 
              onChange={(e) => setSelectedAssignment(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              disabled={!selectedStudent}
            >
              <option value="">-- Choose Assignment --</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
            {selectedAssignment && (
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                {assignment?.description}
              </p>
            )}
          </div>

          <button 
            onClick={handleStartSession}
            disabled={!isReady}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '18px',
              backgroundColor: isReady ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isReady ? 'pointer' : 'not-allowed'
            }}
          >
            Start Assessment
          </button>
          
          {message && <p>{message}</p>}
        </div>
      )}
      
      {/* Already Completed Modal */}
      {showCompletedModal && existingSessionData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3>Session Already Completed</h3>
            <p>
              You have already completed this assignment on{' '}
              {new Date(existingSessionData.completed_at).toLocaleDateString()}.
            </p>
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              Please select a different assignment to continue.
            </p>
            
            <button
              onClick={() => {
                setShowCompletedModal(false)
                setSelectedAssignment('')
                setExistingSessionData(null)
              }}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Choose Different Assignment
            </button>
          </div>
        </div>
      )}

      {currentView === 'session' && student && assignment && (
        <SpeechSession
          studentId={student.id}
          studentName={student.name}
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          onComplete={handleSessionComplete}
          onCancel={handleBackToHome}
        />
      )}

      {currentView === 'results' && student && assignment && (
        <Results
          studentName={student.name}
          assignmentTitle={assignment.title}
          transcript={sessionTranscript}
          score={parseInt(sessionStorage.getItem('lastScore') || '85')}
          scoreCategory={sessionStorage.getItem('lastScoreCategory') || 'green'}
          feedback={sessionStorage.getItem('lastFeedback') || 'Good analysis with clear examples.'}
          onBack={handleBackToHome}
        />
      )}
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentFlow />} />
      <Route path="/instructor" element={<Instructor />} />
    </Routes>
  )
}

export default App
