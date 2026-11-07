"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Sends signed-in visitors to the dashboard. Renders nothing, so the
 * landing page around it stays fully server-rendered for crawlers.
 */
export default function RedirectIfAuthed() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace("/dashboard");
  }, [hasHydrated, isAuthenticated, router]);

  return null;
}
