import { ChartCard, ChartEmpty } from "@/components/stats/chart-card";
import type { TopProduct } from "@/types/api";

/** Best-selling products as horizontal bars, value at the bar's end. One series, so no legend. */
export function TopProducts({ products, monthLabel }: { products: TopProduct[]; monthLabel: string }) {
  const max = Math.max(1, ...products.map((p) => p.quantity_sold));

  return (
    <ChartCard
      title="Top products"
      description={`Units sold on paid invoices in ${monthLabel}.`}
      table={{
        caption: `Top products by units sold in ${monthLabel}`,
        columns: ["Product", "Units sold"],
        rows: products.map((p) => [p.name, p.quantity_sold]),
      }}
    >
      {products.length === 0 ? (
        <ChartEmpty>No products sold in {monthLabel}.</ChartEmpty>
      ) : (
        <ol className="space-y-3" aria-label="Top products by units sold">
          {products.map((p) => (
            <li key={`${p.product_id ?? "custom"}-${p.name}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate" title={p.name}>
                  {p.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums">{p.quantity_sold}</span>
              </div>
              <div className="h-2.5 w-full" aria-hidden="true">
                <div
                  className="h-full min-w-1 rounded-r-[4px] rounded-l-none bg-chart-1"
                  style={{ width: `${(p.quantity_sold / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}
