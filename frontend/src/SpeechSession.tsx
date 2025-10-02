import { useState, useRef, useCallback } from 'react'
import heatherPhoto from './assets/Heather James photo.png'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
  const [currentAiResponse, setCurrentAiResponse] = useState('')
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

    // Clear the previous AI response text when submitting new response
    setCurrentAiResponse('')
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
          // Don't clear AI response text when audio ends - keep it until next question
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
      // Don't clear AI response text when audio ends - keep it until next question
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
        // Don't clear AI response text when audio ends - keep it until next question
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
    <div className="relative min-h-screen">
      {/* Logo removed - now handled by parent component */}

      {/* Big white container taking up most of the screen */}
      <Card className="w-[90vw] mx-auto my-10 min-h-[calc(100vh-80px)] relative p-10 shadow-lg">
        {/* Main content - centered */}
        <div className="flex flex-col items-center text-center h-full justify-center">
          <h2 className="text-2xl font-semibold">{assignmentTitle}</h2>
          <p className="text-base mt-2">Student: {studentName}</p>
        </div>

        {/* Timer in bottom right corner of white container */}
        <div className={`absolute bottom-5 right-5 text-2xl font-bold ${
          timeLeft < 60 ? 'text-red-600' : 'text-gray-800'
        }`}>
          {formatTime(timeLeft)}
        </div>

        {/* End Session button in bottom left corner of white container */}
        {transcript.length > 0 && (
          <Button
            onClick={handleComplete}
            disabled={!sessionInitialized}
            variant="destructive"
            className="absolute bottom-5 left-5 text-sm disabled:opacity-60"
            title={sessionInitialized ? 'End the session' : 'Please wait for session to initialize'}
          >
            End Session
          </Button>
        )}

      {/* Professor Avatar Area */}
      <div className="h-[200px] flex flex-row justify-center items-center my-8 relative gap-10">
        {/* Professor Avatar Container */}
        <div className="flex flex-col items-center">
          <img
            src={heatherPhoto}
            alt="Professor Heather James"
            className={`w-[140px] h-[120px] rounded-[70px_70px_60px_60px] object-cover relative z-[2] ${
              sessionState === 'ai_speaking' ? 'border-[3px] border-[#ff4444] animate-pulse-border' :
              sessionState === 'loading_response' ? 'border-[3px] border-blue-500 animate-pulse-border' :
              ''
            }`}
          />

          {/* Status Text */}
          <div className="mt-5 text-center">
            {sessionState === 'ai_speaking' && audioUrl && (
              <>
                <p className="text-[#ff4444] font-bold">AI Professor is ready to speak</p>
                <Button
                  onClick={playAiResponse}
                  className="mt-2.5 bg-[#ff4444] hover:bg-[#ff6666]"
                >
                  🔊 Play Response
                </Button>
              </>
            )}
            {sessionState === 'ai_speaking' && !audioUrl && (
              <p className="text-black font-bold">AI Professor is speaking...</p>
            )}
            {sessionState === 'student_recording' && !isRecording && (
              <p className="text-green-600">Starting recording for your response...</p>
            )}
            {sessionState === 'student_recording' && isRecording && (
              <p className="text-black font-bold">Recording your turn...</p>
            )}
            {sessionState === 'processing' && (
              <p className="text-orange-600">Processing your response...</p>
            )}
            {sessionState === 'loading_response' && (
              <p className="text-blue-500">AI response loading...</p>
            )}
          </div>
        </div>

        {/* AI Speech Bubble - Show when we have AI text (until next question is pressed) */}
        {currentAiResponse && (
          <div className="max-w-[300px] bg-gray-100 border-2 border-[#ff4444] rounded-[15px] p-4 relative text-sm leading-relaxed shadow-md">
            {/* Speech bubble tail pointing to professor */}
            <div className="absolute -left-[10px] top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-[#ff4444]" />
            <div className="absolute -left-2 top-[21px] w-0 h-0 border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent border-r-[9px] border-r-gray-100" />

            {/* AI Response Text */}
            <div className="text-gray-800 font-medium">
              {currentAiResponse}
            </div>
          </div>
        )}
      </div>

      {/* Waveform Visualization (Placeholder) */}
      {sessionState === 'student_recording' && isRecording && (
        <div className="h-[60px] flex items-center justify-center my-5">
          <div className="flex gap-[3px] items-center">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-[3px] bg-green-600 animate-bounce"
                style={{
                  height: `${Math.random() * 40 + 10}px`,
                  animation: `bounce ${0.5 + Math.random() * 0.5}s infinite alternate`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2.5 mt-8 justify-center">
        {sessionState === 'not_started' ? (
          <Button
            onClick={handleStartSession}
            className="px-10 py-3 text-base font-semibold bg-gray-800 hover:bg-gray-700 rounded-full"
          >
            Start Assessment
          </Button>
        ) : (
          <>
            {sessionState === 'student_recording' && isRecording && (
              <Button
                onClick={submitRecording}
                className="px-10 py-3 text-base font-semibold bg-gray-800 hover:bg-gray-700 rounded-full"
              >
                Next Question
              </Button>
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
      </Card>
    </div>
  )
}

export default SpeechSession