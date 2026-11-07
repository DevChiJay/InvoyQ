"use client";

import AppShell from "@/components/layout/app-shell";
import { navigation, primaryAction } from "@/constants/navigation";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navigation={navigation} primaryAction={primaryAction} homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
