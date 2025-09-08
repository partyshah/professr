import { useState, useRef, useCallback } from 'react'
import heatherPhoto from './assets/Heather James photo.png'

interface SpeechSessionProps {
  studentId: number
  studentName: string
  assignmentId: number
  assignmentTitle: string
  onComplete: (transcript: any[], evaluation?: any) => void
  onCancel: () => void
}

type SessionState = 'ai_speaking' | 'student_recording' | 'processing' | 'loading_response'

interface Turn {
  speaker: 'student' | 'ai'
  text: string
}

function SpeechSession({ 
  studentId, 
  studentName, 
  assignmentId, 
  assignmentTitle, 
  onComplete, 
  onCancel 
}: SpeechSessionProps) {
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [sessionState, setSessionState] = useState<SessionState>('ai_speaking')
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [, setCurrentAiResponse] = useState('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [, setWaitingForPlay] = useState(false)
  const [aiSessionId, setAiSessionId] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<number | undefined>(undefined)
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setSessionState('student_recording')
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const submitRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return
    
    setSessionState('processing')
    
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    
    // Wait for recording to finish
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        
        // Send to speech-to-text
        const formData = new FormData()
        formData.append('audio_file', audioBlob, 'recording.wav')
        
        const speechResponse = await fetch(`${apiUrl}/speech-to-text`, {
          method: 'POST',
          body: formData
        })
        
        if (!speechResponse.ok) {
          throw new Error('Speech-to-text failed')
        }
        
        const speechData = await speechResponse.json()
        const studentText = speechData.transcript
        
        // Add student response to transcript
        const newTranscript = [...transcript, { speaker: 'student' as const, text: studentText }]
        setTranscript(newTranscript)
        
        // Get AI response using new system
        setSessionState('loading_response')
        
        if (!aiSessionId) {
          throw new Error('AI session not initialized')
        }
        
        const aiResponse = await fetch(`${apiUrl}/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: aiSessionId,
            message: studentText
          })
        })
        
        if (!aiResponse.ok) {
          throw new Error('AI response failed')
        }
        
        const aiData = await aiResponse.json()
        const aiText = aiData.response
        
        // Add AI response to transcript
        const finalTranscript = [...newTranscript, { speaker: 'ai' as const, text: aiText }]
        setTranscript(finalTranscript)
        setCurrentAiResponse(aiText)
        
        // Convert AI response to speech
        const ttsResponse = await fetch(`${apiUrl}/text-to-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: aiText })
        })
        
        if (!ttsResponse.ok) {
          throw new Error('Text-to-speech failed')
        }
        
        const audioArrayBuffer = await ttsResponse.arrayBuffer()
        console.log('Received audio buffer size:', audioArrayBuffer.byteLength)
        const audioBlob2 = new Blob([audioArrayBuffer], { type: 'audio/mpeg' })
        const newAudioUrl = URL.createObjectURL(audioBlob2)
        console.log('Created audio URL:', newAudioUrl)
        
        // Auto-play AI response
        const audio = new Audio(newAudioUrl)
        setSessionState('ai_speaking')
        
        audio.onended = () => {
          // Auto-start recording when AI finishes speaking
          startRecording()
          URL.revokeObjectURL(newAudioUrl)
        }
        
        try {
          await audio.play()
        } catch (error) {
          console.error('Auto-play failed:', error)
          // Fallback: set up for manual play
          setAudioUrl(newAudioUrl)
        }
        
      } catch (error) {
        console.error('Error processing recording:', error)
        alert('Error processing your response. Please try again.')
        setSessionState('student_recording')
      }
    }
  }, [mediaRecorderRef, isRecording, transcript, assignmentTitle, apiUrl])

  const playAiResponse = async () => {
    if (!audioUrl) {
      console.log('No audio URL available')
      return
    }
    
    console.log('Attempting to play audio:', audioUrl)
    const audio = new Audio(audioUrl)
    
    // Add error handling
    audio.onerror = (e) => {
      console.error('Audio error:', e)
      alert('Error loading audio file')
    }
    
    audio.onloadeddata = () => {
      console.log('Audio loaded successfully')
    }
    
    audio.onended = () => {
      console.log('Audio playback ended')
      startRecording()
      setWaitingForPlay(false)
      URL.revokeObjectURL(audioUrl)
      setAudioUrl('')
    }
    
    try {
      console.log('Starting audio playback...')
      await audio.play()
      setWaitingForPlay(false)
      console.log('Audio is now playing')
    } catch (error) {
      console.error('Error playing audio:', error)
      alert(`Error playing audio response: ${error}`)
    }
  }

  const handleStartSession = async () => {
    // First, get microphone permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
    } catch (error) {
      alert('Microphone access required for this assessment. Please allow access and try again.')
      return
    }
    
    // Initialize AI session with PDF context
    setSessionState('loading_response')
    
    try {
      // Step 1: Start AI session
      const sessionResponse = await fetch(`${apiUrl}/start-ai-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          assignment_id: assignmentId
        })
      })
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to start AI session')
      }
      
      const sessionData = await sessionResponse.json()
      setAiSessionId(sessionData.session_id)
      
      // Step 2: Get initial AI greeting
      const aiResponse = await fetch(`${apiUrl}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          message: 'Hello, I\'m ready to begin discussing today\'s readings.'
        })
      })
      
      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response')
      }
      
      const aiData = await aiResponse.json()
      const aiText = aiData.response
      
      setCurrentAiResponse(aiText)
      
      // Convert to speech
      const ttsResponse = await fetch(`${apiUrl}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: aiText })
      })
      
      const audioArrayBuffer = await ttsResponse.arrayBuffer()
      console.log('Initial audio buffer size:', audioArrayBuffer.byteLength)
      const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' })
      const newAudioUrl = URL.createObjectURL(audioBlob)
      console.log('Initial audio URL:', newAudioUrl)
      
      // Auto-play initial AI greeting
      const audio = new Audio(newAudioUrl)
      setSessionState('ai_speaking')
      
      audio.onended = () => {
        // Auto-start recording when AI finishes speaking
        startRecording()
        URL.revokeObjectURL(newAudioUrl)
      }
      
      try {
        await audio.play()
      } catch (error) {
        console.error('Auto-play failed:', error)
        // Fallback: set up for manual play
        setAudioUrl(newAudioUrl)
      }
      
      // Add AI greeting to transcript
      setTranscript([{ speaker: 'ai', text: aiText }])
      
      // Start timer
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Error starting session. Please try again.')
    }
  }

  const handleComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // Evaluate AI session if we have a session ID
    let evaluation = null
    if (aiSessionId) {
      try {
        const evaluationResponse = await fetch(`${apiUrl}/evaluate-ai-session?session_id=${aiSessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (evaluationResponse.ok) {
          evaluation = await evaluationResponse.json()
          console.log('Session evaluated:', evaluation)
        }
      } catch (error) {
        console.error('Error evaluating session:', error)
      }
    }
    
    onComplete(transcript, evaluation)
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

      {/* Professor Avatar Area */}
      <div style={{
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '30px 0',
        position: 'relative'
      }}>
        {/* Professor Avatar */}
        <img 
          src={heatherPhoto} 
          alt="Professor Heather James"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            position: 'relative',
            zIndex: 2
          }}
        />

        {/* Pulsing Animation for AI Speaking */}
        {sessionState === 'ai_speaking' && (
          <div style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid #ff4444',
            animation: 'pulse 1s infinite',
            zIndex: 1
          }} />
        )}

        {/* Loading Animation */}
        {sessionState === 'loading_response' && (
          <div style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #2196F3',
            animation: 'spin 1s linear infinite',
            zIndex: 1
          }} />
        )}

        {/* Status Text */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {sessionState === 'ai_speaking' && audioUrl && (
            <>
              <p style={{ color: '#ff4444', fontWeight: 'bold' }}>AI Professor is ready to speak</p>
              <button
                onClick={playAiResponse}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                🔊 Play Response
              </button>
            </>
          )}
          {sessionState === 'ai_speaking' && !audioUrl && (
            <p style={{ color: '#ff4444', fontWeight: 'bold' }}>AI Professor is speaking...</p>
          )}
          {sessionState === 'student_recording' && !isRecording && (
            <p style={{ color: '#4CAF50' }}>Starting recording for your response...</p>
          )}
          {sessionState === 'student_recording' && isRecording && (
            <p style={{ color: '#4CAF50' }}>🎤 Recording... Click "Submit Response" when done</p>
          )}
          {sessionState === 'processing' && (
            <p style={{ color: '#ff9800' }}>Processing your response...</p>
          )}
          {sessionState === 'loading_response' && (
            <p style={{ color: '#2196F3' }}>AI response loading...</p>
          )}
        </div>
      </div>

      {/* Waveform Visualization (Placeholder) */}
      {sessionState === 'student_recording' && isRecording && (
        <div style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0'
        }}>
          <div style={{
            display: 'flex',
            gap: '3px',
            alignItems: 'center'
          }}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${Math.random() * 40 + 10}px`,
                  backgroundColor: '#4CAF50',
                  animation: `bounce ${0.5 + Math.random() * 0.5}s infinite alternate`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
        {!transcript.length ? (
          <button
            onClick={handleStartSession}
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '18px',
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
            {sessionState === 'student_recording' && isRecording && (
              <button
                onClick={submitRecording}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✓ Submit Response
              </button>
            )}
            
            <button
              onClick={handleComplete}
              style={{
                padding: '12px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              End Session
            </button>
          </>
        )}
        
        <button
          onClick={onCancel}
          style={{
            padding: '12px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.3); }
        }
      `}</style>
    </div>
  )
}

export default SpeechSession