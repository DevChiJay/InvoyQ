"use client";

import { Bar, BarChart, CartesianGrid, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartCard, ChartEmpty } from "@/components/stats/chart-card";
import { formatCompactCurrency, formatCurrency, parseDecimal } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { MonthTrendPoint } from "@/types/api";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-3)" },
} satisfies ChartConfig;

const shortMonth = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" });
const longMonth = (m: number, y: number) => new Date(y, m - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });

interface TrendChartProps {
  months: MonthTrendPoint[];
  currency: string;
  selected: { month: number; year: number };
  /** Called when a month's bars are clicked. */
  onSelectMonth: (month: number, year: number) => void;
}

/** Revenue against expenses for the last few months. Clicking a month jumps to it. */
export function TrendChart({ months, currency, selected, onSelectMonth }: TrendChartProps) {
  const reduced = usePrefersReducedMotion();
  const data = months.map((m) => ({
    label: shortMonth(m.month),
    month: m.month,
    year: m.year,
    revenue: parseDecimal(m.revenue),
    expenses: parseDecimal(m.expenses),
  }));
  const hasData = data.some((d) => d.revenue > 0 || d.expenses > 0);
  const selectedLabel = shortMonth(selected.month);
  const best = data.reduce((a, b) => (b.revenue > a.revenue ? b : a), data[0]);

  return (
    <ChartCard
      title="Revenue and expenses"
      description={`Last ${months.length} months. Select a month to see it in detail.`}
      table={{
        caption: "Revenue and expenses by month",
        columns: ["Month", "Revenue", "Expenses", "Net income"],
        rows: months.map((m) => [
          longMonth(m.month, m.year),
          formatCurrency(parseDecimal(m.revenue), currency),
          formatCurrency(parseDecimal(m.expenses), currency),
          formatCurrency(parseDecimal(m.net_income), currency),
        ]),
      }}
    >
      {hasData ? (
        <>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
          {(["revenue", "expenses"] as const).map((key) => (
            <li key={key} className="flex items-center gap-2 text-muted-foreground">
              <span className="size-3 rounded-[3px]" style={{ background: config[key].color }} aria-hidden="true" />
              {config[key].label}
            </li>
          ))}
        </ul>
        <ChartContainer
          config={config}
          className="h-64 w-full"
          role="img"
          aria-label={`Bar chart of revenue and expenses for the last ${months.length} months. Highest revenue: ${longMonth(best.month, best.year)}, ${formatCurrency(best.revenue, currency)}.`}
        >
          <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <ReferenceArea x1={selectedLabel} x2={selectedLabel} fill="var(--muted)" fillOpacity={0.7} ifOverflow="visible" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickMargin={4}
              tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                    return p ? longMonth(p.month, p.year) : "";
                  }}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-6">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ background: `var(--color-${name})` }}
                          aria-hidden="true"
                        />
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatCurrency(Number(value), currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {(["revenue", "expenses"] as const).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={!reduced}
                cursor="pointer"
                onClick={(_, index) => {
                  const d = data[index];
                  if (d) onSelectMonth(d.month, d.year);
                }}
              />
            ))}
          </BarChart>
        </ChartContainer>
        </>
      ) : (
        <ChartEmpty>No revenue or expenses in these months yet. Paid invoices and recorded expenses will show up here.</ChartEmpty>
      )}
    </ChartCard>
  );
}
