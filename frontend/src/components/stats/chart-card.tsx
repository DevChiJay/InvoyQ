import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** The same data as a table, for keyboard and screen-reader users (and anyone who wants exact numbers). */
  table?: { caption: string; columns: string[]; rows: (string | number)[][] };
  className?: string;
}

/** Card shell for a chart: heading, the chart, and a collapsed "View as table". */
export function ChartCard({ title, description, children, table, className }: ChartCardProps) {
  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader>
        <CardTitle as="h2" className="text-base">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {table && (
          <details className="group text-sm">
            <summary className="w-fit cursor-pointer rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              View as table
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-left text-sm tabular-nums">
                <caption className="sr-only">{table.caption}</caption>
                <thead className="sticky top-0 bg-muted text-muted-foreground">
                  <tr>
                    {table.columns.map((c, i) => (
                      <th key={c} scope="col" className={cn("px-3 py-2 font-medium", i > 0 && "text-right")}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {table.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, i) => (
                        <td key={i} className={cn("px-3 py-1.5", i > 0 && "text-right")}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

/** Plain message shown inside a chart card when there is nothing to plot. */
export function ChartEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
