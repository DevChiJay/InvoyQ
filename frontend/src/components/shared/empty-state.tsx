import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** The next step, usually a single Button. */
  action?: React.ReactNode;
  className?: string;
}

/** Shared empty / no-results state: what's missing and what to do next. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}>
      <div className="mb-4 rounded-full bg-accent p-4">
        <Icon className="size-8 text-accent-foreground" aria-hidden="true" />
      </div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
