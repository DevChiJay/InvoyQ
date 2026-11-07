"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartCard, ChartEmpty } from "@/components/stats/chart-card";
import { formatCompactCurrency, formatCurrency, parseDecimal } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { DailyPoint } from "@/types/api";

const config = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig;

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" });

/** Revenue from paid invoices, day by day, for the selected month. One series, so no legend. */
export function DailyChart({ daily, currency, monthLabel }: { daily: DailyPoint[]; currency: string; monthLabel: string }) {
  const reduced = usePrefersReducedMotion();
  const data = daily.map((d) => ({ date: d.date, day: Number(d.date.slice(8)), revenue: parseDecimal(d.revenue) }));
  const active = data.filter((d) => d.revenue > 0);
  const lastDay = data.length;
  const ticks = [1, 5, 10, 15, 20, 25, lastDay].filter((d, i, all) => d <= lastDay && all.indexOf(d) === i && (d !== 25 || lastDay - 25 >= 3));
  const total = active.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <ChartCard
      title="Daily revenue"
      description={`Paid invoices in ${monthLabel}, by issue date.`}
      table={{
        caption: `Daily revenue in ${monthLabel}`,
        columns: ["Day", "Revenue"],
        rows: active.map((d) => [dayLabel(d.date), formatCurrency(d.revenue, currency)]),
      }}
    >
      {active.length > 0 ? (
        <ChartContainer
          config={config}
          className="h-64 w-full"
          role="img"
          aria-label={`Area chart of daily revenue in ${monthLabel}. ${active.length} days with paid invoices, ${formatCurrency(total, currency)} in total.`}
        >
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} ticks={ticks} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickMargin={4}
              tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                    return p ? dayLabel(p.date) : "";
                  }}
                  formatter={(value) => (
                    <span className="font-medium tabular-nums text-foreground">{formatCurrency(Number(value), currency)}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="linear"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="var(--color-revenue)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 5, fill: "var(--color-revenue)", stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={!reduced}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartEmpty>No paid invoices in {monthLabel} yet.</ChartEmpty>
      )}
    </ChartCard>
  );
}
