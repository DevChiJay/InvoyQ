import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableHeadProps {
  label: string;
  /** Whether this column is the active sort, and in which direction. */
  direction: "asc" | "desc" | null;
  onSort: () => void;
  align?: "left" | "right";
  className?: string;
}

/** Table header with a real button for sorting and the matching aria-sort state. */
export function SortableHead({ label, direction, onSort, align = "left", className }: SortableHeadProps) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
      className={cn(align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "-mx-2 inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", direction ? "text-foreground" : "text-muted-foreground/60")} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
