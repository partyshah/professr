import { useState, useEffect } from 'react'
import './App.css'

interface Student {
  id: number
  name: string
}

interface Assignment {
  id: number
  title: string
  description: string
}

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedAssignment, setSelectedAssignment] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState<string>('')
  
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
  }, [selectedStudent, selectedAssignment])

  const handleStartSession = () => {
    if (!isReady) return
    
    // For now, just show what was selected
    const student = students.find(s => s.id === parseInt(selectedStudent))
    const assignment = assignments.find(a => a.id === parseInt(selectedAssignment))
    
    alert(`Starting session:\nStudent: ${student?.name}\nAssignment: ${assignment?.title}`)
  }

  return (
    <>
      <h1>Oral Assessment Tool</h1>
      
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
              {assignments.find(a => a.id === parseInt(selectedAssignment))?.description}
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
    </>
  )
}

export default App
