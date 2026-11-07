'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { isAxiosError } from 'axios'
import { authAPI } from '@/lib/api'
import { formatErrorMessage } from '@/lib/utils'

export default function ResendVerificationPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const { data } = await authAPI.resendVerification(email)
      setStatus('success')
      setMessage(data.message || 'Verification email sent successfully!')
    } catch (error) {
      setStatus('error')
      if (isAxiosError(error) && error.response) {
        setMessage(
          formatErrorMessage(
            error.response.data?.detail,
            'Failed to send verification email. Please try again.',
          ),
        )
      } else {
        setMessage('Network error. Please check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="h-8 w-8"
              aria-label="Back to login"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Resend Verification Email</CardTitle>
              <CardDescription>Enter your email to receive a new verification link</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {status === 'success' && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || status === 'success'}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll send you a new verification link to this email address.
              </p>
            </div>

            {status === 'success' && (
              <div className="rounded-lg border bg-muted p-4 text-sm">
                <p className="font-medium mb-1">What&apos;s next?</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>Return to login page</li>
                </ol>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            {status !== 'success' && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Email
                  </>
                )}
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleGoBack}
            >
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
