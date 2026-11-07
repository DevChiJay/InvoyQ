"use client";

import Link from "next/link";
import { AlertCircle, FileText, Package, Receipt, Users, Wallet, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/hooks/use-dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

interface Kpi {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  href: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
  featured?: boolean;
}

function KpiCard({ label, value, hint, href, icon: Icon, tone = "default", featured }: Kpi) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        featured && "col-span-2 lg:col-span-1",
      )}
    >
      <Card className="h-full gap-3 p-4 transition-colors group-hover:border-primary/40 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon
            className={cn("size-4 shrink-0", tone === "danger" ? "text-destructive" : "text-muted-foreground")}
            aria-hidden="true"
          />
        </div>
        <p
          className={cn(
            "font-display font-semibold tracking-tight tabular-nums",
            featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
            tone === "danger" && "text-destructive",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </Card>
    </Link>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className={cn("h-28 rounded-xl", i === 0 && "col-span-2 lg:col-span-1")} />
        ))}
      </div>
    );
  }

  const money = (amount: number | undefined) => formatCurrency(amount ?? 0, stats.currency);

  const kpis: Kpi[] = [
    {
      label: "Revenue",
      value: money(stats.totalRevenue),
      hint: "From paid invoices",
      href: "/dashboard/invoices",
      icon: Wallet,
      featured: true,
    },
    {
      label: "Invoices",
      value: stats.totalInvoices,
      hint: `${stats.paidInvoices} paid · ${stats.unpaidInvoices} unpaid`,
      href: "/dashboard/invoices",
      icon: FileText,
    },
    {
      label: "Overdue",
      value: stats.overdueInvoices,
      hint: stats.overdueInvoices ? "Need a reminder" : "Nothing overdue",
      href: "/dashboard/invoices",
      icon: AlertCircle,
      tone: stats.overdueInvoices ? "danger" : "default",
    },
    {
      label: "Clients",
      value: stats.totalClients,
      hint: "Active clients",
      href: "/dashboard/clients",
      icon: Users,
    },
    {
      label: "Products",
      value: stats.totalProducts ?? 0,
      hint: stats.totalInventoryValue ? `${money(stats.totalInventoryValue)} in stock` : "No stock value yet",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      label: "Expenses this month",
      value: money(stats.monthlyExpenses),
      hint: `${stats.monthlyExpenseCount ?? 0} recorded`,
      href: "/dashboard/expenses",
      icon: Receipt,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
