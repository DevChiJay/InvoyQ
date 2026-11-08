import { Badge } from "@/components/ui/badge";
import { formatStatus, getStatusVariant } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Invoice / payment status pill. The colour mapping lives in lib/format.ts:getStatusVariant. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={getStatusVariant(status)} className={cn("capitalize", className)}>
      {formatStatus(status)}
    </Badge>
  );
}
