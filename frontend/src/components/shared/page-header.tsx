import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links shown on the right; they wrap under the title on narrow screens. */
  actions?: React.ReactNode;
  /** Optional element above the title, e.g. a back link. */
  back?: React.ReactNode;
  className?: string;
}

/** The one page-title pattern for signed-in pages: a single H1, optional description and actions. */
export function PageHeader({ title, description, actions, back, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {back}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
