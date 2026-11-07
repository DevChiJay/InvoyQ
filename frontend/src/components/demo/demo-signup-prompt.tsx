'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';

interface DemoSignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoSignupPrompt({ isOpen, onClose }: DemoSignupPromptProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSignup = () => {
    setIsNavigating(true);
    // Store that user came from demo for potential future use
    sessionStorage.setItem('demo_completed', 'true');
    router.push('/register');
  };

  const benefits = [
    'Save and manage all your invoices',
    'Organize clients and track payments',
    'Generate professional PDF invoices',
    'Get 10 free extractions per month',
    'Access your data from anywhere',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl">Great! Your Invoice is Ready</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Sign up now to save this invoice and unlock the full power of InvoyQ
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isNavigating}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleSignup}
            className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/30"
            disabled={isNavigating}
          >
            {isNavigating ? 'Redirecting...' : 'Sign Up Free'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
