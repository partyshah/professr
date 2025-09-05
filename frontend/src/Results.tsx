import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'

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
  const [showNotification, setShowNotification] = useState(false)
  
  const getScoreColor = (category: string) => {
    switch(category) {
      case 'green': return '#4CAF50'
      case 'yellow': return '#ff9800'
      case 'red': return '#f44336'
      default: return '#666'
    }
  }
  
  const generatePDF = () => {
    const pdf = new jsPDF()
    let yPosition = 20
    const pageHeight = pdf.internal.pageSize.height
    const lineHeight = 7
    const margin = 20
    const maxWidth = 170 // page width - margins
    
    // Helper function to add text and handle page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      if (isBold) {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      
      const lines = pdf.splitTextToSize(text, maxWidth)
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, margin, yPosition)
        yPosition += lineHeight
      })
    }
    
    // Header
    addText('Assessment Results', 18, true)
    yPosition += 5
    
    // Student Info
    addText(`Student: ${studentName}`, 12, true)
    addText(`Assignment: ${assignmentTitle}`, 12, true)
    addText(`Date: ${new Date().toLocaleDateString()}`, 12)
    yPosition += 10
    
    // Score Section
    addText('Score', 14, true)
    const scoreText = `${score}/100 (${scoreCategory.toUpperCase()})`
    addText(scoreText, 12)
    yPosition += 10
    
    // AI Feedback Section
    addText('Feedback', 14, true)
    addText(feedback, 12)
    yPosition += 10
    
    // Transcript Section
    addText('Conversation Transcript', 14, true)
    yPosition += 5
    
    transcript.forEach((turn) => {
      // Check for page break before each turn
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 20
      }
      
      const speaker = turn.speaker === 'student' ? 'Student' : 'AI Professor'
      addText(`${speaker}:`, 12, true)
      addText(turn.text, 11)
      yPosition += 5 // Add spacing between turns
    })
    
    // Footer
    yPosition = pageHeight - 15
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'italic')
    pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, yPosition)
    
    // Generate filename
    const cleanName = studentName.replace(/[^a-z0-9]/gi, '_')
    const cleanAssignment = assignmentTitle.replace(/[^a-z0-9]/gi, '_')
    const date = new Date().toISOString().split('T')[0]
    const filename = `${cleanName}_${cleanAssignment}_${date}.pdf`
    
    // Save the PDF
    pdf.save(filename)
  }
  
  const handleDownloadPDF = () => {
    generatePDF()
    setShowNotification(true)
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px', position: 'relative' }}>
      {/* Download Notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ✓ Results saved to PDF
        </div>
      )}
      
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

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleDownloadPDF}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📄 Download PDF
        </button>
        <button
          onClick={onBack}
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
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default Results