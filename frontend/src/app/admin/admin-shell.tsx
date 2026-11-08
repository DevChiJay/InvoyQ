"use client";

import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { adminNavigation } from "@/constants/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      navigation={adminNavigation}
      homeHref="/admin"
      badge="Admin"
      footerLink={{ name: "Back to dashboard", href: "/dashboard", icon: ArrowLeft }}
      requireAdmin
    >
      {children}
    </AppShell>
  );
}
