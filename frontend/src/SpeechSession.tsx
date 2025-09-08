import { useState, useRef, useCallback } from 'react'
import springImage from './assets/spring_image.jpeg'

interface SpeechSessionProps {
  studentId: number
  studentName: string
  assignmentId: number
  assignmentTitle: string
  onComplete: (transcript: any[], evaluation?: any) => void
  onCancel: () => void
}

type SessionState = 'not_started' | 'ai_speaking' | 'student_recording' | 'processing' | 'loading_response'

interface Turn {
  speaker: 'student' | 'ai'
  text: string
}

function SpeechSession({ 
  studentId, 
  studentName, 
  assignmentId, 
  assignmentTitle, 
  onComplete
}: SpeechSessionProps) {
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [sessionState, setSessionState] = useState<SessionState>('not_started')
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [, setCurrentAiResponse] = useState('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [, setWaitingForPlay] = useState(false)
  const [aiSessionId, setAiSessionId] = useState<string | null>(null)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [isAutoEndResponse, setIsAutoEndResponse] = useState(false)
  
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
        const shouldAutoEnd = aiData.auto_end === true
        
        // Track if this is an auto-end response
        setIsAutoEndResponse(shouldAutoEnd)
        
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
          if (shouldAutoEnd) {
            // AI said farewell - automatically end session
            console.log('Auto-ending session after farewell message')
            handleComplete()
          } else {
            // Normal flow: Auto-start recording when AI finishes speaking
            startRecording()
          }
          URL.revokeObjectURL(newAudioUrl)
        }
        
        try {
          await audio.play()
        } catch (error) {
          console.error('Auto-play failed:', error)
          // Fallback: set up for manual play
          setAudioUrl(newAudioUrl)
          // Note: isAutoEndResponse state is already set, so manual play will handle auto-end correctly
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
      if (isAutoEndResponse) {
        // AI said farewell - automatically end session
        console.log('Auto-ending session after manual play of farewell message')
        handleComplete()
      } else {
        // Normal flow: Auto-start recording when AI finishes speaking
        startRecording()
      }
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
      setSessionInitialized(true)
      
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
    
    // Always try to get proper AI evaluation
    let evaluation = null
    if (aiSessionId && sessionInitialized) {
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
    } else {
      // If session wasn't properly initialized, create a basic evaluation
      console.warn('Session ended without proper AI initialization')
      evaluation = {
        score: 70,
        category: 'yellow',
        feedback: 'Session ended before proper evaluation could be completed. This typically happens when ending the session too quickly after starting. Please allow the AI professor to begin speaking before ending future sessions.',
        question_count: 0
      }
    }
    
    onComplete(transcript, evaluation)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Logo removed - now handled by parent component */}

      {/* Big white container taking up most of the screen */}
      <div style={{
        backgroundColor: 'white',
        width: '90vw',
        margin: '40px auto',
        minHeight: 'calc(100vh - 80px)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        padding: '40px'
      }}>
        {/* Main content - centered */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          height: '100%',
          justifyContent: 'center'
        }}>
          <h2>{assignmentTitle}</h2>
          <p>Student: {studentName}</p>
        </div>

        {/* Timer in bottom right corner of white container */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: timeLeft < 60 ? '#ff0000' : '#333'
        }}>
          {formatTime(timeLeft)}
        </div>

        {/* End Session button in bottom left corner of white container */}
        {transcript.length > 0 && (
          <button
            onClick={handleComplete}
            disabled={!sessionInitialized}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              padding: '12px 20px',
              backgroundColor: sessionInitialized ? '#f44336' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: sessionInitialized ? 'pointer' : 'not-allowed',
              opacity: sessionInitialized ? 1 : 0.6,
              fontSize: '14px'
            }}
            title={sessionInitialized ? 'End the session' : 'Please wait for session to initialize'}
          >
            End Session
          </button>
        )}

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
          src={springImage} 
          alt="Professor"
          style={{
            width: '140px',
            height: '120px',
            borderRadius: '70px 70px 60px 60px',
            objectFit: 'cover',
            position: 'relative',
            zIndex: 2,
            border: sessionState === 'ai_speaking' ? '3px solid #ff4444' : 
                    sessionState === 'loading_response' ? '3px solid #2196F3' : 
                    'none',
            animation: (sessionState === 'ai_speaking' || sessionState === 'loading_response') ? 
                      'pulse-border 1.5s ease-in-out infinite' : 'none'
          }}
        />

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
            <p style={{ color: '#000', fontWeight: 'bold' }}>AI Professor is speaking...</p>
          )}
          {sessionState === 'student_recording' && !isRecording && (
            <p style={{ color: '#4CAF50' }}>Starting recording for your response...</p>
          )}
          {sessionState === 'student_recording' && isRecording && (
            <p style={{ color: '#000', fontWeight: 'bold' }}>Recording your turn...</p>
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
      <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'center' }}>
        {!transcript.length ? (
          <button
            onClick={handleStartSession}
            style={{
              padding: '12px 40px',
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
            Start Assessment
          </button>
        ) : (
          <>
            {sessionState === 'student_recording' && isRecording && (
              <button
                onClick={submitRecording}
                style={{
                  padding: '12px 40px',
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
                Submit Response
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-border {
          0% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
          }
        }
        
        @keyframes bounce {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.3); }
        }
      `}</style>
      </div>
    </div>
  )
}

export default SpeechSession