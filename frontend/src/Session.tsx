import { useState, useEffect, useRef, useCallback } from 'react'

interface SessionProps {
  studentId: number
  studentName: string
  assignmentId: number
  assignmentTitle: string
  onComplete: (transcript: any[]) => void
  onCancel: () => void
}

type ConversationStatus = 'ai_speaking' | 'user_turn' | 'processing' | 'idle'

interface Turn {
  speaker: 'student' | 'ai'
  text: string
}

function Session({ studentName, assignmentTitle, onComplete, onCancel }: SessionProps) {
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [status, setStatus] = useState<ConversationStatus>('idle')
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const intervalRef = useRef<number>()
  const turnCountRef = useRef(0)

  // Mock conversation data
  const mockExchanges = [
    {
      ai: "Welcome! Today we'll discuss the assignment. Can you start by giving me your initial thoughts on the topic?",
      student: "I think this topic is really interesting because it relates to what we've been studying in class."
    },
    {
      ai: "That's a good start. Can you elaborate on specific examples that support your perspective?",
      student: "Well, for example, when we look at the historical context, we can see clear patterns emerging."
    },
    {
      ai: "Excellent observation. How do you think this applies to modern situations?",
      student: "I believe the same principles apply today, especially when we consider current events and social dynamics."
    },
    {
      ai: "Very insightful. Can you identify any potential counterarguments to your position?",
      student: "Yes, some might argue that the circumstances are too different to draw direct parallels."
    }
  ]

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isStarted, timeLeft, handleSubmit])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startSession = () => {
    setIsStarted(true)
    // Start with AI speaking
    simulateConversation()
  }

  const simulateConversation = async () => {
    for (let i = 0; i < mockExchanges.length; i++) {
      if (turnCountRef.current >= 4) break // Limit to 4 exchanges
      
      // AI speaks
      setStatus('ai_speaking')
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTranscript(prev => [...prev, { speaker: 'ai', text: mockExchanges[i].ai }])
      
      // User's turn
      setStatus('user_turn')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Processing
      setStatus('processing')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTranscript(prev => [...prev, { speaker: 'student', text: mockExchanges[i].student }])
      
      turnCountRef.current++
    }
    setStatus('idle')
  }

  const handleSubmit = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsStarted(false)
    onComplete(transcript)
  }, [transcript, onComplete])

  const handleQuickSubmit = () => {
    // For testing - submit early with current transcript
    handleSubmit()
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
      <h2>{assignmentTitle}</h2>
      <p>Student: {studentName}</p>
      
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '30px 0',
        color: timeLeft < 60 ? '#ff0000' : '#000'
      }}>
        {formatTime(timeLeft)}
      </div>

      {!isStarted ? (
        <button
          onClick={startSession}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start Assessment
        </button>
      ) : (
        <>
          <div style={{
            height: '150px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            {status === 'ai_speaking' && (
              <>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤖</div>
                <p style={{ fontSize: '18px', color: '#666' }}>AI is speaking...</p>
              </>
            )}
            {status === 'user_turn' && (
              <>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎤</div>
                <p style={{ fontSize: '18px', color: '#4CAF50' }}>Your turn to speak</p>
              </>
            )}
            {status === 'processing' && (
              <>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                <p style={{ fontSize: '18px', color: '#ff9800' }}>Processing...</p>
              </>
            )}
            {status === 'idle' && (
              <p style={{ fontSize: '18px', color: '#666' }}>Ready</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleQuickSubmit}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Quick Submit (Testing)
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            Turns completed: {turnCountRef.current}
          </p>
        </>
      )}
    </div>
  )
}

export default Session