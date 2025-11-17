'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      if (!token) {
        setStatus('error');
        toast.error('No authentication token received.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      try {
        // Store token
        setToken(token);

        // Fetch user data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUser(userData);

        setStatus('success');
        toast.success('Successfully logged in!');
        
        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 1000);
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        toast.error('Failed to complete authentication.');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Completing sign in...</h2>
              <p className="mt-2 text-gray-600">Please wait while we set up your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
              <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Authentication Failed</h2>
              <p className="mt-2 text-gray-600">Redirecting to login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="mx-auto max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
            <p className="mt-2 text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
