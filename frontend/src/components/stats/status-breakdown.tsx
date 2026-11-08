import { ChartCard, ChartEmpty } from "@/components/stats/chart-card";
import { cn } from "@/lib/utils";

/** Fixed order and fixed styling per status, so a status never changes colour when others are absent. */
const STATUSES = [
  { key: "paid", label: "Paid", swatch: "bg-success" },
  { key: "sent", label: "Sent", swatch: "bg-chart-1" },
  { key: "draft", label: "Draft", swatch: "bg-muted-foreground" },
  { key: "overdue", label: "Overdue", swatch: "bg-destructive" },
  // Striped, so it stays distinct from Draft without relying on colour
  {
    key: "cancelled",
    label: "Cancelled",
    swatch: "bg-[repeating-linear-gradient(45deg,var(--muted-foreground)_0_2px,transparent_2px_5px)] ring-1 ring-inset ring-muted-foreground",
  },
] as const;

/** One stacked bar of the month's invoices by status, with a labelled legend underneath. */
export function StatusBreakdown({ counts, monthLabel }: { counts: Record<string, number>; monthLabel: string }) {
  const rows = STATUSES.map((s) => ({ ...s, count: counts[s.key] ?? 0 }));
  const total = rows.reduce((n, r) => n + r.count, 0);
  const summary = rows
    .filter((r) => r.count > 0)
    .map((r) => `${r.count} ${r.label.toLowerCase()}`)
    .join(", ");

  return (
    <ChartCard
      title="Invoices by status"
      description={`${total} ${total === 1 ? "invoice" : "invoices"} issued in ${monthLabel}.`}
      table={{
        caption: `Invoices by status in ${monthLabel}`,
        columns: ["Status", "Invoices", "Share"],
        rows: rows.map((r) => [r.label, r.count, total ? `${Math.round((r.count / total) * 100)}%` : "0%"]),
      }}
    >
      {total === 0 ? (
        <ChartEmpty>No invoices issued in {monthLabel}.</ChartEmpty>
      ) : (
        <div className="space-y-5">
          <div role="img" aria-label={`Invoices by status: ${summary}.`} className="flex h-4 w-full gap-0.5">
            {rows
              .filter((r) => r.count > 0)
              .map((r, i, visible) => (
                <div
                  key={r.key}
                  title={`${r.label}: ${r.count}`}
                  style={{ flexGrow: r.count, flexBasis: 0 }}
                  className={cn(
                    "min-w-1 rounded-[4px]",
                    r.swatch,
                    i === 0 && "rounded-l-full",
                    i === visible.length - 1 && "rounded-r-full",
                  )}
                />
              ))}
          </div>
          <ul className="grid gap-2 text-sm" aria-label="Legend">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-3">
                <span className={cn("size-3 shrink-0 rounded-[3px]", r.swatch)} aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">{r.label}</span>
                <span className="font-medium tabular-nums">{r.count}</span>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                  {total ? Math.round((r.count / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
