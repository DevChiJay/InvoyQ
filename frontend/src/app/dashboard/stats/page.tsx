"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useMonthlyStats } from "@/lib/hooks/use-monthly-stats";
import { useStatsTrend } from "@/lib/hooks/use-stats-trend";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/stats/kpi-card";
import { TrendChart } from "@/components/stats/trend-chart";
import { DailyChart } from "@/components/stats/daily-chart";
import { StatusBreakdown } from "@/components/stats/status-breakdown";
import { TopProducts } from "@/components/stats/top-products";
import { formatCurrency, parseDecimal } from "@/lib/format";

const monthName = (m: number, y: number, style: "short" | "long" = "long") =>
  new Date(y, m - 1, 1).toLocaleString("en", style === "long" ? { month: "long", year: "numeric" } : { month: "short" });

/** Change from `previous` to `current` as a fraction; null when there is nothing to compare against. */
function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

function ChartsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading statistics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MonthlyStatsPage() {
  const { stats, isLoading, error, month, year, currency, goToCurrentMonth, setMonthYear, isCurrentMonth } =
    useMonthlyStats("NGN");
  // Trend and daily detail come from a newer endpoint; if it is missing the rest of the page still works.
  const { data: trend } = useStatsTrend(month, year, currency);

  const label = monthName(month, year);
  const money = (value: string | number) => formatCurrency(parseDecimal(value), currency);

  const previous = useMemo(() => {
    if (!trend || trend.months.length < 2) return null;
    return trend.months[trend.months.length - 2];
  }, [trend]);
  const against = previous ? monthName(previous.month, previous.year, "short") : undefined;
  const change = (current: string, key: "revenue" | "expenses" | "net_income") =>
    previous ? relativeChange(parseDecimal(current), parseDecimal(previous[key])) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly stats" description="How the business did, month by month." />

      <Card className="py-1">
        <CardContent className="px-4 py-0">
          <MonthNavigator
            month={month}
            year={year}
            onMonthChange={setMonthYear}
            showTodayButton={true}
            onTodayClick={goToCurrentMonth}
            isCurrentMonth={isCurrentMonth}
          />
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load monthly statistics. Please try again.</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <ChartsSkeleton />
      ) : !stats ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No data for this month"
            description="Create invoices and record expenses to see your figures here."
          />
        </Card>
      ) : (
        <>
          <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={money(stats.total_revenue)}
              change={change(stats.total_revenue, "revenue")}
              against={against}
              hint="From paid invoices"
            />
            <KpiCard
              label="Expenses"
              value={money(stats.total_expenses)}
              change={change(stats.total_expenses, "expenses")}
              against={against}
              hint="All expenses"
            />
            <KpiCard
              label="Net income"
              value={money(stats.net_income)}
              tone={parseDecimal(stats.net_income) < 0 ? "negative" : "default"}
              change={change(stats.net_income, "net_income")}
              against={against}
              hint="Revenue minus expenses"
            />
            <KpiCard
              label="Unpaid invoices"
              value={stats.unpaid_invoices}
              hint={`${stats.paid_invoices} paid of ${stats.total_invoices} issued`}
            />
          </section>

          {trend && (
            <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              <TrendChart
                months={trend.months}
                currency={currency}
                selected={{ month, year }}
                onSelectMonth={setMonthYear}
              />
              <DailyChart daily={trend.daily} currency={currency} monthLabel={label} />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {stats.status_counts && <StatusBreakdown counts={stats.status_counts} monthLabel={label} />}
            <TopProducts products={stats.top_products ?? []} monthLabel={label} />
          </div>

          <Card>
            <CardContent>
              <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { label: "Products sold", value: stats.total_products_sold },
                  { label: "New clients", value: stats.new_clients },
                  { label: "Invoices issued", value: stats.total_invoices },
                ].map((item) => (
                  <div key={item.label} className="py-3 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="font-display text-2xl font-semibold tabular-nums">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
