'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Mail, Smartphone } from 'lucide-react'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const source = searchParams.get('source') // Get source from URL

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [registrationSource, setRegistrationSource] = useState<string>('web')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          setEmail(data.email || '')
          setRegistrationSource(data.registration_source || source || 'web')
        } else {
          setStatus('error')
          setMessage(data.detail || 'Verification failed. The link may be expired or invalid.')
        }
      } catch {
        setStatus('error')
        setMessage('Failed to verify email. Please try again later.')
      }
    }

    verifyEmail()
  }, [token, source])

  const handleResendEmail = () => {
    router.push('/resend-verification')
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Verifying Your Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Email Verified!</CardTitle>
              <CardDescription>Your email has been successfully verified.</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>We couldn&apos;t verify your email address.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center">
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{message}</p>
              {email && (
                <p className="text-sm font-medium">
                  <Mail className="inline h-4 w-4 mr-1" />
                  {email}
                </p>
              )}
              {registrationSource === 'mobile' ? (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Please open the InvoYQ mobile app to continue
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your email has been verified! Return to the mobile app and log in with your credentials.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">
                  You can now log in to your account and start using InvoYQ!
                </p>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground pt-2">
                The verification link may have expired or is invalid. You can request a new verification email.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {status === 'success' && registrationSource !== 'mobile' && (
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login
            </Button>
          )}

          {status === 'error' && (
            <>
              <Button onClick={handleResendEmail} className="w-full">
                Resend Verification Email
              </Button>
              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                Go to Login
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
