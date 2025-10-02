import { useState, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import './App.css'
import SpeechSession from './SpeechSession'
import Results from './Results'
import Instructor from './Instructor'
import RoleSelection from './RoleSelection'
import ClassCodeEntry from './ClassCodeEntry'
import professrLogo from './assets/Professr Logo.png'

// Protected Route Wrapper for Student Flow
function ProtectedStudentRoute() {
  const { classId } = useParams<{ classId: string }>()

  // Check if class info exists and matches the URL param
  const storedClassInfo = sessionStorage.getItem('classInfo')

  if (!storedClassInfo) {
    // No authentication, redirect to code entry
    return <Navigate to="/student" replace />
  }

  try {
    const classInfo = JSON.parse(storedClassInfo)

    // Verify the classId in URL matches the authenticated class
    if (classInfo.id.toString() !== classId) {
      // Class ID mismatch, clear storage and redirect
      sessionStorage.removeItem('classInfo')
      return <Navigate to="/student" replace />
    }

    // Valid authentication, render StudentFlow
    return <StudentFlow />
  } catch (error) {
    // Invalid JSON in storage, clear and redirect
    sessionStorage.removeItem('classInfo')
    return <Navigate to="/student" replace />
  }
}

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
  const [showDirectionsModal, setShowDirectionsModal] = useState(false)
  const [classInfo, setClassInfo] = useState<any>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Load class info from sessionStorage (already validated by ProtectedStudentRoute)
  useEffect(() => {
    const storedClassInfo = sessionStorage.getItem('classInfo')
    if (storedClassInfo) {
      const parsedInfo = JSON.parse(storedClassInfo)
      setClassInfo(parsedInfo)
    }
  }, [])

  useEffect(() => {
    // Load students and assignments when class info is available
    if (classInfo) {
      loadData()
    }
  }, [classInfo])

  const loadData = async () => {
    try {
      console.log('API URL:', apiUrl)
      console.log('Loading data for class:', classInfo?.id)

      // Seed data if needed
      const seedResponse = await fetch(`${apiUrl}/seed-data`, { method: 'POST' })
      console.log('Seed response:', seedResponse.status)

      // Fetch students filtered by class_id
      const studentsResponse = await fetch(`${apiUrl}/students?class_id=${classInfo.id}`)
      console.log('Students response:', studentsResponse.status)
      if (!studentsResponse.ok) {
        throw new Error(`Students API failed: ${studentsResponse.status}`)
      }
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.students)

      // Fetch assignments filtered by class_id
      const assignmentsResponse = await fetch(`${apiUrl}/assignments?class_id=${classInfo.id}`)
      console.log('Assignments response:', assignmentsResponse.status)
      if (!assignmentsResponse.ok) {
        throw new Error(`Assignments API failed: ${assignmentsResponse.status}`)
      }
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments)
    } catch (error) {
      console.error('Load data error:', error)
      setMessage(`Error loading data: ${error instanceof Error ? error.message : 'Connection failed'}`)
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
    
    // Show directions modal first
    setShowDirectionsModal(true)
  }

  const handleContinueToSession = () => {
    setShowDirectionsModal(false)
    setCurrentView('session')
  }

  const handleSessionComplete = async (transcript: any[], evaluation?: any) => {
    setSessionTranscript(transcript)
    
    if (evaluation) {
      // Store evaluation data from AI system
      sessionStorage.setItem('lastScore', evaluation.score?.toString() || '75')
      sessionStorage.setItem('lastScoreCategory', evaluation.category || 'yellow')
      sessionStorage.setItem('lastFeedback', evaluation.feedback || 'No feedback available')
      setCurrentView('results')
    } else {
      // If no evaluation provided, show error - all sessions should now use AI evaluation
      alert('Session evaluation failed. Please try starting a new session.')
      setCurrentView('selection')
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      {/* Main content area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
      }}>
        {currentView === 'selection' && (
          <div style={{
            maxWidth: '800px',
            width: '100%',
            padding: '30px 60px 30px 60px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            
            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="student-select" style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                What is your name?
              </label>
              <select 
                id="student-select"
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  color: '#333'
                }}
                onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#333'}
                onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#ddd'}
              >
                <option value="">Student</option>
                {students
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="assignment-select" style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                Which readings are we discussing?
              </label>
              <select 
                id="assignment-select"
                value={selectedAssignment} 
                onChange={(e) => setSelectedAssignment(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  color: '#333'
                }}
                disabled={!selectedStudent}
                onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#333'}
                onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#ddd'}
              >
                <option value="">Assignment</option>
                {assignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                onClick={handleStartSession}
                disabled={!isReady}
                style={{
                  width: '120px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: isReady ? '#333' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (isReady) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#555'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isReady) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#333'
                  }
                }}
              >
                Enter
              </button>
            </div>
            
            {message && (
              <p style={{ 
                color: '#e74c3c', 
                marginTop: '15px', 
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Professr Logo - positioned based on current view */}
      {currentView === 'session' ? (
        // Logo at top left during session
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1000
        }}>
          <img 
            src={professrLogo} 
            alt="Professr Logo" 
            style={{
              height: '50px',
              width: 'auto'
            }}
          />
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Professr
          </span>
        </div>
      ) : (
        // Logo at bottom during selection/results
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem'
        }}>
          <img 
            src={professrLogo} 
            alt="Professr Logo" 
            style={{
              height: '60px',
              width: 'auto'
            }}
          />
          <span style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Professr
          </span>
        </div>
      )}
      
      {/* Directions Modal */}
      {showDirectionsModal && (
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
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Directions (actually read this...)
            </h2>
            
            <ul style={{
              fontSize: '1rem',
              color: '#333',
              lineHeight: '1.6',
              marginBottom: '30px',
              paddingLeft: '20px'
            }}>
              <li style={{ marginBottom: '12px' }}>
                You will be discussing this week's readings as if you're having a normal conversation with your professor.
              </li>
              <li style={{ marginBottom: '12px' }}>
                At the end, you'll receive feedback on whether your ideas reflected the key ideas from the readings.
              </li>
              <li style={{ marginBottom: '12px' }}>
                To get the most out of this, don't just give 1 sentence answers! Justify your ideas in the context of the readings.
              </li>
              <li style={{ marginBottom: '12px' }}>
                The conversation will last 10 minutes.
              </li>
            </ul>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleContinueToSession}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#555'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#333'}
              >
                Continue
              </button>
            </div>
          </div>
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
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/student" element={<ClassCodeEntry />} />
      <Route path="/student/:classId" element={<ProtectedStudentRoute />} />
      <Route path="/professor" element={<Instructor />} />
      <Route path="/instructor" element={<Instructor />} />
    </Routes>
  )
}

export default App