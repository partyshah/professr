import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/healthz`)
        const data = await response.json()
        setBackendStatus(data.status === 'healthy' ? '✅ Backend Connected' : '❌ Backend Issue')
      } catch (error) {
        setBackendStatus('❌ Backend Offline')
      }
    }
    checkBackend()
  }, [])

  return (
    <>
      <h1>Production App</h1>
      <div className="card">
        <p>Frontend: ✅ Running</p>
        <p>Backend: {backendStatus}</p>
      </div>
    </>
  )
}

export default App
