interface ResultsProps {
  studentName: string
  assignmentTitle: string
  transcript: Array<{speaker: 'student' | 'ai', text: string}>
  score?: number
  scoreCategory?: string
  feedback?: string
  onBack: () => void
}

function Results({ 
  studentName, 
  assignmentTitle, 
  transcript, 
  score = 85, 
  scoreCategory = 'green',
  feedback = 'Good analysis with clear examples. Consider exploring counterarguments more deeply.',
  onBack 
}: ResultsProps) {
  const getScoreColor = (category: string) => {
    switch(category) {
      case 'green': return '#4CAF50'
      case 'yellow': return '#ff9800'
      case 'red': return '#f44336'
      default: return '#666'
    }
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
      <h2>Assessment Complete</h2>
      <div style={{ marginBottom: '30px' }}>
        <p><strong>Student:</strong> {studentName}</p>
        <p><strong>Assignment:</strong> {assignmentTitle}</p>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <h3>Score</h3>
          <p style={{ 
            fontSize: '36px', 
            fontWeight: 'bold',
            color: getScoreColor(scoreCategory)
          }}>
            {score}/100
          </p>
        </div>
        <div style={{ flex: 2 }}>
          <h3>Feedback</h3>
          <p>{feedback}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Conversation Transcript</h3>
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px'
        }}>
          {transcript.map((turn, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: turn.speaker === 'student' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px'
            }}>
              <strong>{turn.speaker === 'student' ? 'Student' : 'AI Professor'}:</strong>
              <p style={{ margin: '5px 0' }}>{turn.text}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onBack}
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
        Back to Home
      </button>
    </div>
  )
}

export default Results