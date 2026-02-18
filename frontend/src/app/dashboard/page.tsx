"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  useDashboardStats,
  useRecentInvoices,
} from "@/lib/hooks/use-dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentInvoices, isLoading: invoicesLoading } =
    useRecentInvoices(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name}! Here&apos;s an overview of your
            invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={
          stats || {
            totalClients: 0,
            totalInvoices: 0,
            totalRevenue: 0,
            overdueInvoices: 0,
            paidInvoices: 0,
            unpaidInvoices: 0,
            currency: "USD",
          }
        }
        isLoading={statsLoading}
      />

      {/* Recent Invoices */}
      <RecentInvoices
        invoices={recentInvoices || []}
        isLoading={invoicesLoading}
      />
    </div>
  );
}
