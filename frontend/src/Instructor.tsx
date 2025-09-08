import { useState } from 'react'
import { Link } from 'react-router-dom'
import professrLogo from './assets/Professr Logo.png'

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
          justifyContent: 'center',
          paddingTop: '5vh'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '30px 65px 50px 65px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              marginBottom: '30px',
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              Instructor Access
            </h2>
            <div style={{ marginBottom: '25px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
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
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#333'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#ddd'}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#555'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#333'}
            >
              Login
            </button>
            {error && (
              <p style={{ 
                color: '#e74c3c', 
                marginTop: '15px', 
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Professr Logo at bottom */}
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
      </div>
    )
  }

  return (
    <div style={{ padding: '20px clamp(2rem, 5vw, 8rem)', maxWidth: '95%', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Instructor Dashboard</h1>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              style={{ 
                padding: '12px', 
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                color: '#333',
                minWidth: '200px'
              }}
              onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#333'}
              onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#ddd'}
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
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', transition: 'border-color 0.3s ease', color: '#333', minWidth: '200px' }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#333'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#ddd'}
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', maxWidth: 'none' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : filteredSessions.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No sessions found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Student</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Assignment</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <>
                  <tr key={session.session_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{session.student_name}</td>
                    <td style={{ padding: '12px' }}>{session.assignment_title}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {session.score_category === 'green' ? '🟢' : 
                         session.score_category === 'yellow' ? '🟡' : '🔴'}
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