import { useState } from 'react'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  feedback = 'Good analysis with clear examples. Consider exploring counterarguments more deeply.'
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
    <div className="w-[90vw] mx-auto my-10 p-10 bg-white rounded-xl shadow-lg relative">
      {/* Download Notification */}
      {showNotification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded shadow-md z-[1000] flex items-center gap-2">
          ✓ Results saved to PDF
        </div>
      )}

      <h2 className="text-center mb-10 text-2xl font-semibold">Assessment Feedback</h2>

      {/* Two-column layout */}
      <div className="flex gap-10 mb-10 relative">

        {/* Left Column - Scoring and Feedback */}
        <div className="w-[calc(50%-20px)]">
          {/* Student Info */}
          <div className="mb-8">
            <p><strong>Student:</strong> {studentName}</p>
            <p><strong>Assignment:</strong> {assignmentTitle}</p>
          </div>

          {/* Score Section */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center my-4">
                <div className="text-[80px] mb-2.5">
                  {getScoreEmoji(scoreCategory)}
                </div>
                {getOverallFeedback(feedback) ? (
                  <div className="text-base text-gray-800 text-center max-w-md mx-auto leading-snug">
                    {getOverallFeedback(feedback)}
                  </div>
                ) : (
                  <div className="text-lg font-bold text-gray-800">
                    {getScoreText(scoreCategory)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line leading-relaxed text-sm mt-4">
                {getDetailedFeedback(feedback).split('\n').map((line, index) => {
                  // Skip empty lines
                  if (line.trim() === '') {
                    return <br key={index} />
                  }

                  // Check if this line is a learning objective title
                  const isObjectiveTitle = line.includes('Explain and Apply Institutions & Principles') ||
                                         line.includes('Interpret and Compare Theories & Justifications') ||
                                         line.includes('Evaluate Effectiveness & Fairness') ||
                                         line.includes('Propose and Justify Reforms')

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

                  // If it's an objective title, make the title part bold
                  if (isObjectiveTitle) {
                    const colonIndex = processedLine.indexOf(':')
                    if (colonIndex > -1) {
                      const title = processedLine.substring(0, colonIndex)
                      const rest = processedLine.substring(colonIndex)
                      return (
                        <div key={index} className="mb-2">
                          <strong>{title}</strong>{rest}
                        </div>
                      )
                    }
                  }

                  return (
                    <div key={index} className="mb-2">
                      {processedLine}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transcript */}
        <div className="flex-1 absolute right-0 top-12 bottom-0 w-[calc(50%-20px)]">
          <h3 className="mb-4 text-lg font-semibold">Conversation Transcript</h3>
          <div className="absolute top-11 bottom-0 left-0 right-0 overflow-y-auto border border-gray-300 rounded-lg p-5 bg-white">
            {transcript.map((turn, index) => (
              <div
                key={index}
                className={`mb-4 p-2.5 rounded-lg ${
                  turn.speaker === 'student' ? 'bg-blue-50' : 'bg-gray-100'
                }`}
              >
                <strong>{turn.speaker === 'student' ? 'Student' : 'AI Professor'}:</strong>
                <p className="my-1.5">{turn.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleDownloadPDF}
          className="px-14 py-3 text-base font-semibold bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          Download PDF
        </Button>
      </div>
    </div>
  )
}

export default Results
