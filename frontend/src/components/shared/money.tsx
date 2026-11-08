import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number | string | null | undefined;
  currency?: string | null;
  className?: string;
}

/** A formatted amount with tabular figures so columns of money line up. */
export function Money({ amount, currency, className }: MoneyProps) {
  return (
    <span className={cn("tabular-nums whitespace-nowrap", className)}>
      {formatCurrency(amount, currency ?? undefined)}
    </span>
  );
}
