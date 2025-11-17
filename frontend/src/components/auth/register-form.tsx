'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import GoogleOAuthButton from './google-oauth-button';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/\d/, 'Password must contain at least 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Password validation checks
  const passwordChecks = {
    minLength: passwordValue.length >= 6,
    hasNumber: /\d/.test(passwordValue),
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await register(data.email, data.password, data.full_name);
      setRegisteredEmail(data.email);
      toast.success('Account created! Please check your email to verify your account.');
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started with InvoYQ
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registeredEmail ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Account created successfully!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    We&apos;ve sent a verification email to <strong>{registeredEmail}</strong>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">What&apos;s next?</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Return to the login page</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/login')}
                className="flex-1"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => router.push('/resend-verification')}
                variant="outline"
                className="flex-1"
              >
                Resend Email
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setPasswordValue(e.target.value);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  {passwordValue && (
                    <div className="mt-2 space-y-1 text-sm">
                      <div className={cn(
                        'flex items-center gap-2',
                        passwordChecks.minLength ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {passwordChecks.minLength ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>At least 6 characters</span>
                      </div>
                      <div className={cn(
                        'flex items-center gap-2',
                        passwordChecks.hasNumber ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {passwordChecks.hasNumber ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>Contains at least 1 number</span>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground dark:bg-gray-950">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleOAuthButton className="w-full" />

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
