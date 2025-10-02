import { useState, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-100 p-8">
      {/* Main content area */}
      <div className="flex flex-col items-center flex-1 justify-center">
        {currentView === 'selection' && (
          <Card className="max-w-[800px] w-full overflow-visible">
            <CardContent className="py-8 px-16 overflow-visible">
              <div className="mb-6">
                <label htmlFor="student-select" className="block mb-2 text-xl font-bold text-gray-800">
                  What is your name?
                </label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Student" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {students
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-5">
                <label htmlFor="assignment-select" className="block mb-2 text-xl font-bold text-gray-800">
                  Which readings are we discussing?
                </label>
                <Select
                  value={selectedAssignment}
                  onValueChange={setSelectedAssignment}
                  disabled={!selectedStudent}
                >
                  <SelectTrigger id="assignment-select">
                    <SelectValue placeholder="Assignment" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {assignments.map(assignment => (
                      <SelectItem key={assignment.id} value={assignment.id.toString()}>
                        {assignment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center mt-5">
                <Button
                  onClick={handleStartSession}
                  disabled={!isReady}
                  className="w-[120px] px-5 py-3 text-base font-semibold rounded-full"
                >
                  Enter
                </Button>
              </div>

              {message && (
                <p className="text-red-500 mt-4 text-center text-sm">
                  {message}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Professr Logo - positioned based on current view */}
      {currentView === 'session' ? (
        // Logo at top left during session
        <div className="fixed top-5 left-5 flex items-center gap-4 z-[1000]">
          <img
            src={professrLogo}
            alt="Professr Logo"
            className="h-[50px] w-auto"
          />
          <span className="text-2xl font-bold text-gray-800">
            Professr
          </span>
        </div>
      ) : (
        // Logo at bottom during selection/results
        <div className="flex items-center gap-4 p-4">
          <img
            src={professrLogo}
            alt="Professr Logo"
            className="h-[60px] w-auto"
          />
          <span className="text-3xl font-bold text-gray-800">
            Professr
          </span>
        </div>
      )}

      {/* Directions Modal */}
      <Dialog open={showDirectionsModal} onOpenChange={setShowDirectionsModal}>
        <DialogContent className="max-w-[500px] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 text-center mb-5">
              Directions (actually read this...)
            </DialogTitle>
          </DialogHeader>

          <ul className="text-base text-gray-800 leading-relaxed mb-8 pl-5 list-disc">
            <li className="mb-3">
              You will be discussing this week's readings as if you're having a normal conversation with your professor.
            </li>
            <li className="mb-3">
              At the end, you'll receive feedback on whether your ideas reflected the key ideas from the readings.
            </li>
            <li className="mb-3">
              To get the most out of this, don't just give 1 sentence answers! Justify your ideas in the context of the readings.
            </li>
            <li className="mb-3">
              The conversation will last 10 minutes.
            </li>
          </ul>

          <div className="flex justify-center">
            <Button
              onClick={handleContinueToSession}
              className="px-8 py-3 text-base font-semibold rounded-full"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Already Completed Modal */}
      <Dialog open={showCompletedModal} onOpenChange={setShowCompletedModal}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center">Session Already Completed</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p>
              You have already completed this assignment on{' '}
              {new Date(existingSessionData?.completed_at).toLocaleDateString()}.
            </p>
            <p className="text-sm text-gray-600">
              Please select a different assignment to continue.
            </p>

            <Button
              onClick={() => {
                setShowCompletedModal(false)
                setSelectedAssignment('')
                setExistingSessionData(null)
              }}
              className="mt-5"
            >
              Choose Different Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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