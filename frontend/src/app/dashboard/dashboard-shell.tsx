"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { ErrorBoundary } from "@/components/error-boundary";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const hasInitialized = useRef(false);

  // Initialize auth state from localStorage once on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      useAuthStore.getState().initializeAuth();
    }
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (_hasHydrated && !isAuthenticated && !isLoading) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication or before hydration
  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <MobileNav />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
