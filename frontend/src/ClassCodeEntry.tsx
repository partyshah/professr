import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-between bg-background p-8 fixed top-0 left-0 box-border">
      {/* Main content area */}
      <div className="flex flex-col items-center flex-1 justify-center">
        <h1 className="mb-10 text-3xl font-semibold text-foreground text-center">
          Enter your class code
        </h1>

        <Card className="max-w-md w-full">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="6-digit code"
                maxLength={6}
                autoFocus
                className="w-full p-4 text-2xl font-semibold text-center tracking-[0.5rem] font-mono uppercase"
              />

              {error && (
                <p className="text-destructive text-center text-sm mt-4">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={code.length !== 6 || isLoading}
                className="w-full mt-5 py-3.5 text-base font-semibold rounded-[20px]"
              >
                {isLoading ? 'Verifying...' : 'Enter'}
              </Button>
            </form>
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
        <span className="text-3xl font-bold text-foreground">
          Professr
        </span>
      </div>
    </div>
  )
}

export default ClassCodeEntry
