import { useState } from 'react'
import professrLogo from './assets/Professr Logo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Session {
  session_id: number
  student_name: string
  assignment_title: string
  status: string
  final_score: number
  score_category: string
  transcript: Array<{speaker: string, text: string}>
  ai_feedback: string
  completed_at: string
}

interface Assignment {
  id: number
  title: string
}

function Instructor() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [classInfo, setClassInfo] = useState<any>(null)

  // Filters
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // Helper functions for formatting feedback (same as in Results.tsx)
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
      const match = overallLine.match(/overall:\s*(.+)/i)
      if (match) {
        let overallText = match[1]
        overallText = overallText.replace(/\[Red\]|\[Yellow\]|\[Green\]/gi, '')
        overallText = overallText.replace(/^\s*-\s*/, '')
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

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{show: boolean, session: Session | null}>({
    show: false,
    session: null
  })

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiUrl}/verify-professor-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        // Store class info in state
        setClassInfo(data.class)
        setIsAuthenticated(true)
        setError('')
        loadData(data.class.id)
      } else {
        setError(data.detail || 'Invalid password')
      }
    } catch (err) {
      console.error('Error verifying password:', err)
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (classId: number) => {
    setLoading(true)
    try {
      // Load sessions filtered by class_id
      const sessionsResponse = await fetch(`${apiUrl}/test-data?class_id=${classId}`)
      const sessionsData = await sessionsResponse.json()
      setSessions(sessionsData.sessions)

      // Load assignments for filter dropdown filtered by class_id
      const assignmentsResponse = await fetch(`${apiUrl}/assignments?class_id=${classId}`)
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments)
    } catch (error) {
      setError('Error loading data')
    }
    setLoading(false)
  }

  const filteredSessions = sessions.filter(session => {
    const matchesAssignment = selectedAssignment === 'all' || !selectedAssignment || session.assignment_title === selectedAssignment
    const matchesSearch = !searchTerm ||
      session.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesAssignment && matchesSearch
  })

  const handleDelete = async (session: Session) => {
    try {
      const response = await fetch(`${apiUrl}/sessions/${session.session_id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteModal({show: false, session: null})
        handleRefreshData() // Refresh the table
      } else {
        setError('Failed to delete session')
      }
    } catch (error) {
      setError('Error deleting session')
    }
  }

  const handleRefreshData = () => {
    if (classInfo) {
      loadData(classInfo.id)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gray-100 p-8">
        {/* Main content area */}
        <div className="flex flex-col items-center flex-1 justify-center pt-[5vh]">
          <Card className="max-w-[600px] w-full shadow-lg">
            <CardContent className="px-16 py-12">
              <h2 className="mb-8 text-3xl font-semibold text-gray-800 text-center">
                Instructor Access
              </h2>
              <div className="mb-6">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={loading}
              >
                Login
              </Button>
              {error && (
                <p className="text-red-600 mt-4 text-center text-sm">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Professr Logo at bottom */}
        <div className="flex items-center gap-4 p-4">
          <img
            src={professrLogo}
            alt="Professr Logo"
            className="h-[60px] w-auto"
          />
          <span className="text-4xl font-bold text-gray-800">
            Professr
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-5 lg:px-32 max-w-[95%] mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Instructor Dashboard</h1>
        {classInfo && (
          <p className="text-lg text-gray-600 mt-2">
            {classInfo.class_name} • {classInfo.professor_name}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5">
        <div className="flex justify-between items-center">
          <div>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Assignments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                {assignments.map(assignment => (
                  <SelectItem key={assignment.id} value={assignment.title}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="p-0 overflow-hidden max-w-none">
        {loading ? (
          <p className="p-5 text-center">Loading...</p>
        ) : filteredSessions.length === 0 ? (
          <p className="p-5 text-center">No sessions found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg font-bold text-gray-800">Student</TableHead>
                <TableHead className="text-lg font-bold text-gray-800">Assignment</TableHead>
                <TableHead className="text-lg font-bold text-gray-800">Score</TableHead>
                <TableHead className="text-lg font-bold text-gray-800">Status</TableHead>
                <TableHead className="text-lg font-bold text-gray-800">Date</TableHead>
                <TableHead className="text-lg font-bold text-gray-800">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <>
                  <TableRow key={session.session_id}>
                    <TableCell>{session.student_name}</TableCell>
                    <TableCell>{session.assignment_title}</TableCell>
                    <TableCell>
                      <span className="text-base">
                        {session.score_category === 'green' ? '🟢' :
                         session.score_category === 'yellow' ? '🟡' : '🔴'}
                      </span>
                    </TableCell>
                    <TableCell>{session.status}</TableCell>
                    <TableCell>
                      {new Date(session.completed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setExpandedRow(
                          expandedRow === session.session_id ? null : session.session_id
                        )}
                        className="mr-2"
                        size="sm"
                        variant="default"
                      >
                        {expandedRow === session.session_id ? 'Hide' : 'View'}
                      </Button>
                      <Button
                        onClick={() => setDeleteModal({show: true, session})}
                        size="sm"
                        variant="destructive"
                      >
                        🗑️
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === session.session_id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-10 bg-gray-50">
                        {/* Two-column layout matching Results.tsx */}
                        <div className="flex gap-10 relative">

                          {/* Left Column - Scoring and Feedback */}
                          <div className="w-[calc(50%-20px)]">
                            {/* Student Info */}
                            <div className="mb-8">
                              <p><strong>Student:</strong> {session.student_name}</p>
                              <p><strong>Assignment:</strong> {session.assignment_title}</p>
                            </div>

                            {/* Score Section */}
                            <Card className="mb-5 shadow-md">
                              <CardContent className="p-5">
                                <h3 className="text-xl font-semibold mb-4">Overall Assessment</h3>
                                <div className="text-center my-4">
                                  <div className="text-[80px] mb-2">
                                    {getScoreEmoji(session.score_category)}
                                  </div>
                                  {getOverallFeedback(session.ai_feedback) ? (
                                    <div className="text-base text-gray-800 text-center max-w-[400px] mx-auto leading-snug">
                                      {getOverallFeedback(session.ai_feedback)}
                                    </div>
                                  ) : (
                                    <div className="text-lg font-bold text-gray-800">
                                      {getScoreText(session.score_category)}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Feedback Section */}
                            <Card className="shadow-md">
                              <CardContent className="p-5">
                                <h3 className="text-xl font-semibold mb-4">Feedback</h3>
                                <div className="whitespace-pre-line leading-relaxed text-sm mt-4">
                                  {getDetailedFeedback(session.ai_feedback).split('\n').map((line, index) => {
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
                            <h3 className="mb-4 text-xl font-semibold">Conversation Transcript</h3>
                            <div className="absolute top-[45px] bottom-0 left-0 right-0 overflow-y-auto border border-gray-300 rounded-lg p-5 bg-white">
                              {session.transcript.map((turn, index) => (
                                <div
                                  key={index}
                                  className={`mb-4 p-2.5 rounded-lg ${
                                    turn.speaker === 'student' ? 'bg-blue-50' : 'bg-gray-100'
                                  }`}
                                >
                                  <strong>{turn.speaker === 'student' ? 'Student' : 'AI Professor'}:</strong>
                                  <p className="my-1">{turn.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.show} onOpenChange={(open) => !open && setDeleteModal({show: false, session: null})}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Are you sure you want to delete this session?</p>
            {deleteModal.session && (
              <>
                <p><strong>Student:</strong> {deleteModal.session.student_name}</p>
                <p><strong>Assignment:</strong> {deleteModal.session.assignment_title}</p>
              </>
            )}
          </div>
          <div className="flex gap-2.5 mt-5">
            <Button
              onClick={() => setDeleteModal({show: false, session: null})}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteModal.session && handleDelete(deleteModal.session)}
              variant="destructive"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Instructor
