import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import professrLogo from './assets/Professr Logo.png'

function ClassCodeEntry() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/verify-class-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        // Store class info in sessionStorage
        sessionStorage.setItem('classInfo', JSON.stringify(data.class))
        // Navigate to student flow with class ID
        navigate(`/student/${data.class.id}`)
      } else {
        setError(data.detail || 'Invalid access code')
      }
    } catch (err) {
      console.error('Error verifying code:', err)
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6)
    setCode(value)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
      margin: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      boxSizing: 'border-box'
    }}>
      {/* Main content area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
      }}>
        <h1 style={{
          marginBottom: '40px',
          fontSize: '2rem',
          fontWeight: '600',
          color: '#333',
          textAlign: 'center'
        }}>
          Enter your class code
        </h1>

        <form onSubmit={handleSubmit} style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="6-digit code"
            maxLength={6}
            autoFocus
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#333'}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#ddd'}
          />

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

          <button
            type="submit"
            disabled={code.length !== 6 || isLoading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: code.length === 6 && !isLoading ? '#333' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: code.length === 6 && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (code.length === 6 && !isLoading) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#555'
              }
            }}
            onMouseLeave={(e) => {
              if (code.length === 6 && !isLoading) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#333'
              }
            }}
          >
            {isLoading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
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

export default ClassCodeEntry
