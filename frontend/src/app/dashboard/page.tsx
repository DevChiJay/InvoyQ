"use client";

import Link from "next/link";
import { AlertCircle, Plus, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboardStats, useRecentInvoices } from "@/lib/hooks/use-dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_CURRENCY } from "@/lib/currency";

const EMPTY_STATS = {
  totalClients: 0,
  totalInvoices: 0,
  totalRevenue: 0,
  overdueInvoices: 0,
  paidInvoices: 0,
  unpaidInvoices: 0,
  currency: DEFAULT_CURRENCY,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const stats = useDashboardStats();
  const recent = useRecentInvoices(5);
  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="Here's where your invoicing stands."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="h-4 w-4" />
              New invoice
            </Link>
          </Button>
        }
      />

      <Card className="flex-row flex-wrap items-center gap-4 border-primary/20 bg-accent/60 p-5 sm:p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="text-lg font-semibold">Turn a chat into an invoice</h2>
          <p className="text-sm text-muted-foreground">
            Paste a WhatsApp or email conversation. The AI drafts the invoice and you check it before saving.
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/extract">Extract from chat</Link>
        </Button>
      </Card>

      {(stats.isError || recent.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some numbers didn&apos;t load</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>Check your connection, then try again.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                stats.refetch();
                recent.refetch();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <StatsCards stats={stats.data ?? EMPTY_STATS} isLoading={stats.isLoading} />

      <RecentInvoices invoices={recent.data ?? []} isLoading={recent.isLoading} />
    </div>
  );
}
