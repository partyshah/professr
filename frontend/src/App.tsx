import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  const [testData, setTestData] = useState<any>(null)
  const [message, setMessage] = useState<string>('')
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${apiUrl}/healthz`)
        const data = await response.json()
        setBackendStatus(data.status === 'healthy' ? '✅ Backend Connected' : '❌ Backend Issue')
      } catch (error) {
        setBackendStatus('❌ Backend Offline')
      }
    }
    checkBackend()
  }, [])

  const createTestData = async () => {
    try {
      setMessage('Creating test data...')
      const response = await fetch(`${apiUrl}/test-data`, {
        method: 'POST',
      })
      const data = await response.json()
      setMessage(`✅ Test data created! Session ID: ${data.session_id}`)
    } catch (error) {
      setMessage('❌ Error creating test data')
    }
  }

  const showTestData = async () => {
    try {
      setMessage('Fetching test data...')
      const response = await fetch(`${apiUrl}/test-data`)
      const data = await response.json()
      setTestData(data)
      setMessage(`✅ Found ${data.sessions.length} session(s)`)
    } catch (error) {
      setMessage('❌ Error fetching test data')
    }
  }

  return (
    <>
      <h1>Oral Assessment Tool</h1>
      
      <div className="card">
        <p>Frontend: ✅ Running</p>
        <p>Backend: {backendStatus}</p>
      </div>

      <div className="card">
        <h2>Database Test</h2>
        <button onClick={createTestData} style={{ marginRight: '10px' }}>
          Create Test Data
        </button>
        <button onClick={showTestData}>
          Show Data
        </button>
        {message && <p>{message}</p>}
      </div>

      {testData && (
        <div className="card">
          <h2>Test Results</h2>
          {testData.sessions.map((session: any) => (
            <div key={session.session_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <h3>{session.student_name} - {session.assignment_title}</h3>
              <p><strong>Score:</strong> {session.final_score} ({session.score_category})</p>
              <p><strong>Status:</strong> {session.status}</p>
              <div>
                <h4>Transcript:</h4>
                {session.transcript.map((turn: any, index: number) => (
                  <p key={index} style={{ marginLeft: '20px' }}>
                    <strong>{turn.speaker === 'student' ? 'Student' : 'AI'}:</strong> {turn.text}
                  </p>
                ))}
              </div>
              <p><strong>AI Feedback:</strong> {session.ai_feedback}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default App
