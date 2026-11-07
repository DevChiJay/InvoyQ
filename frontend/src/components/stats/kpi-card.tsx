import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  /** Colour for the figure only when it carries meaning (e.g. a negative net income). */
  tone?: "default" | "negative";
  /** Change against the previous month, as a fraction (0.12 = +12%). null = no earlier figure to compare. */
  change?: number | null;
  /** Name of the month compared against, e.g. "Oct". */
  against?: string;
  hint?: string;
}

/** One headline number. The change is neutral grey: more expenses or less revenue isn't judged for you. */
export function KpiCard({ label, value, tone = "default", change, against, hint }: KpiCardProps) {
  const Icon = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="gap-2 py-5">
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-display text-2xl font-semibold tabular-nums tracking-tight",
            tone === "negative" && "text-destructive-strong",
          )}
        >
          {value}
        </p>
        {change !== undefined ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className="size-3.5" aria-hidden="true" />
            {change === null
              ? `No ${against ?? "earlier"} figure to compare`
              : change === 0
                ? `Same as ${against ?? "last month"}`
                : `${Math.abs(Math.round(change * 100))}% ${change > 0 ? "more" : "less"} than ${against ?? "last month"}`}
          </p>
        ) : (
          hint && <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
