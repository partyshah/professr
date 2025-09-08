import { useState } from 'react'
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
  
  const getScoreEmoji = (category: string) => {
    switch(category) {
      case 'green': return '🟢'
      case 'yellow': return '🟡'
      case 'red': return '🔴'
      default: return '⚪'
    }
  }

  const getScoreText = (category: string) => {
    switch(category) {
      case 'green': return 'On track!'
      case 'yellow': return 'Needs improvement'
      case 'red': return 'Unsatisfactory'
      default: return 'Unknown'
    }
  }

  // Extract Overall feedback line - get everything after "Overall:"
  const getOverallFeedback = (feedback: string) => {
    const lines = feedback.split('\n')
    const overallLine = lines.find(line => line.toLowerCase().includes('overall'))
    
    if (overallLine) {
      // Find everything after "Overall:" including color indicators
      const match = overallLine.match(/overall:\s*(.+)/i)
      if (match) {
        let overallText = match[1] // Gets everything after "Overall:"
        // Clean up color brackets but keep the explanation
        overallText = overallText.replace(/\[Red\]|\[Yellow\]|\[Green\]/gi, '')
        overallText = overallText.replace(/^\s*-\s*/, '') // Remove leading dash
        return overallText.trim()
      }
    }
    return ''
  }

  // Remove Overall line from bottom section
  const getDetailedFeedback = (feedback: string) => {
    return feedback.split('\n')
      .filter(line => !line.toLowerCase().includes('overall:'))
      .join('\n')
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
    <div style={{ 
      width: '90vw',
      margin: '40px auto', 
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      position: 'relative' 
    }}>
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
      
      <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Assessment Feedback</h2>
      
      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
        
        {/* Left Column - Scoring and Feedback */}
        <div style={{ flex: 1 }}>
          {/* Student Info */}
          <div style={{ marginBottom: '30px' }}>
            <p><strong>Student:</strong> {studentName}</p>
            <p><strong>Assignment:</strong> {assignmentTitle}</p>
          </div>

          {/* Score Section */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Overall Assessment</h3>
            <div style={{ 
              textAlign: 'center',
              margin: '20px 0'
            }}>
              <div style={{ 
                fontSize: '80px', 
                marginBottom: '10px'
              }}>
                {getScoreEmoji(scoreCategory)}
              </div>
              {getOverallFeedback(feedback) ? (
                <div style={{
                  fontSize: '16px',
                  color: '#333',
                  textAlign: 'center',
                  maxWidth: '400px',
                  margin: '0 auto',
                  lineHeight: '1.4'
                }}>
                  {getOverallFeedback(feedback)}
                </div>
              ) : (
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {getScoreText(scoreCategory)}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <h3>Feedback</h3>
            <div style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: '1.6',
              fontSize: '14px',
              marginTop: '15px'
            }}>
              {getDetailedFeedback(feedback).split('\n').map((line, index) => {
                // Skip empty lines
                if (line.trim() === '') {
                  return <br key={index} />
                }
                
                // Simple emoji replacement - handle all common patterns
                let processedLine = line
                processedLine = processedLine.replace(/\[Green\]/gi, '🟢')
                processedLine = processedLine.replace(/\[Yellow\]/gi, '🟡')  
                processedLine = processedLine.replace(/\[Red\]/gi, '🔴')
                processedLine = processedLine.replace(/:\s*Green\b/gi, ': 🟢')
                processedLine = processedLine.replace(/:\s*Yellow\b/gi, ': 🟡')
                processedLine = processedLine.replace(/:\s*Red\b/gi, ': 🔴')
                processedLine = processedLine.replace(/\bGreen\b/g, '🟢')
                processedLine = processedLine.replace(/\bYellow\b/g, '🟡')
                processedLine = processedLine.replace(/\bRed\b/g, '🔴')
                
                return (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    {processedLine}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Transcript */}
        <div style={{ flex: 1 }}>
          <h3>Conversation Transcript</h3>
          <div style={{
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '15px'
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleDownloadPDF}
          style={{
            padding: '12px 55px',
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
          Download PDF
        </button>
      </div>
    </div>
  )
}

export default Results