import { useState } from 'react'

interface Session {
  session_id: number
  student_name: string
  assignment_title: string
  status: string
  final_score: number
  score_category: string
  transcript: Array<{speaker: string, text: string}>
  ai_feedback: string
  completed_at: string
}

interface Assignment {
  id: number
  title: string
}

function Instructor() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Filters
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  
  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{show: boolean, session: Session | null}>({
    show: false,
    session: null
  })

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleLogin = () => {
    if (password === 'password') {
      setIsAuthenticated(true)
      setError('')
      loadData()
    } else {
      setError('Incorrect password')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load sessions
      const sessionsResponse = await fetch(`${apiUrl}/test-data`)
      const sessionsData = await sessionsResponse.json()
      setSessions(sessionsData.sessions)

      // Load assignments for filter dropdown
      const assignmentsResponse = await fetch(`${apiUrl}/assignments`)
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments)
    } catch (error) {
      setError('Error loading data')
    }
    setLoading(false)
  }

  const filteredSessions = sessions.filter(session => {
    const matchesAssignment = !selectedAssignment || session.assignment_title === selectedAssignment
    const matchesSearch = !searchTerm || 
      session.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesAssignment && matchesSearch
  })

  const handleDelete = async (session: Session) => {
    try {
      const response = await fetch(`${apiUrl}/sessions/${session.session_id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setDeleteModal({show: false, session: null})
        loadData() // Refresh the table
      } else {
        setError('Failed to delete session')
      }
    } catch (error) {
      setError('Error deleting session')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto', padding: '30px' }}>
        <h2>Instructor Access</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Instructor Dashboard</h1>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Student View
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ marginRight: '8px' }}>Assignment:</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              style={{ padding: '4px', fontSize: '14px' }}
            >
              <option value="">All Assignments</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.title}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ marginRight: '8px' }}>Student:</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '4px', fontSize: '14px', width: '200px' }}
            />
          </div>
          <button
            onClick={() => {
              setSelectedAssignment('')
              setSearchTerm('')
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : filteredSessions.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No sessions found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Student</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Assignment</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <>
                  <tr key={session.session_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{session.student_name}</td>
                    <td style={{ padding: '12px' }}>{session.assignment_title}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: session.score_category === 'green' ? '#4CAF50' : 
                               session.score_category === 'yellow' ? '#ff9800' : '#f44336'
                      }}>
                        {session.final_score}/100
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{session.status}</td>
                    <td style={{ padding: '12px' }}>
                      {new Date(session.completed_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setExpandedRow(
                          expandedRow === session.session_id ? null : session.session_id
                        )}
                        style={{
                          marginRight: '8px',
                          padding: '4px 8px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {expandedRow === session.session_id ? 'Hide' : 'View'}
                      </button>
                      <button
                        onClick={() => setDeleteModal({show: true, session})}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                  {expandedRow === session.session_id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
                        <div>
                          <h4>AI Feedback:</h4>
                          <p style={{ marginBottom: '20px' }}>{session.ai_feedback}</p>
                          
                          <h4>Transcript:</h4>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {session.transcript.map((turn, index) => (
                              <div key={index} style={{
                                marginBottom: '10px',
                                padding: '8px',
                                backgroundColor: turn.speaker === 'student' ? '#e3f2fd' : '#f5f5f5',
                                borderRadius: '4px'
                              }}>
                                <strong>{turn.speaker === 'student' ? 'Student' : 'AI Professor'}:</strong>
                                <p style={{ margin: '4px 0' }}>{turn.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.session && (
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
            width: '90%'
          }}>
            <h3>Delete Session</h3>
            <p>Are you sure you want to delete this session?</p>
            <p><strong>Student:</strong> {deleteModal.session.student_name}</p>
            <p><strong>Assignment:</strong> {deleteModal.session.assignment_title}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setDeleteModal({show: false, session: null})}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.session!)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Instructor