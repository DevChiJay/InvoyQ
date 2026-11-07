import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import VerifyEmailClient from './verify-email-client'

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}
