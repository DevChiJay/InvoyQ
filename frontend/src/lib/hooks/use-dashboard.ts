import { useQuery } from "@tanstack/react-query";
import { clientsAPI, invoicesAPI, productsAPI, expensesAPI } from "@/lib/api";
import type { Invoice } from "@/types/api";
import { parseDecimal } from "@/lib/format";
import { formatDateToYYYYMMDD } from "@/lib/utils";

export interface DashboardStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalProducts?: number;
  totalInventoryValue?: number;
  monthlyExpenses?: number;
  monthlyExpenseCount?: number;
  currency?: string;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch stats from dedicated endpoints in parallel
      const [
        clientStatsResponse,
        invoiceStatsResponse,
        productStatsResponse,
        expensesResponse,
        firstInvoiceResponse,
      ] = await Promise.all([
        clientsAPI.getStats(),
        invoicesAPI.getStats(),
        productsAPI.getStats(),
        expensesAPI
          .getSummary({
            period: "month",
            reference_date: formatDateToYYYYMMDD(new Date()),
          })
          .catch((err) => {
            console.error("Failed to fetch expense summary:", err);
            return {
              data: {
                summaries: [],
                grand_total: "0.00",
                period_start: null,
                period_end: null,
              },
            };
          }),
        invoicesAPI
          .getAll({ limit: 1, offset: 0, sort_by: "created_at", sort_order: 1 })
          .catch((err) => {
            console.error("Failed to fetch first invoice:", err);
            return { data: [] };
          }),
      ]);

      const clientStats = clientStatsResponse.data.stats;
      const invoiceStats = invoiceStatsResponse.data.stats;
      const productStats = productStatsResponse.data.stats;
      const expenseSummary = expensesResponse.data;

      // Calculate expense stats
      const monthlyExpenses = parseDecimal(expenseSummary.grand_total);
      const monthlyExpenseCount =
        expenseSummary.summaries?.reduce(
          (sum, summary) => sum + summary.count,
          0,
        ) || 0;

      // Get currency from first invoice or default to USD
      const firstInvoice = firstInvoiceResponse.data[0];
      const currency = firstInvoice?.currency || "USD";

      return {
        totalClients: clientStats.total_count,
        totalInvoices: invoiceStats.total_count,
        totalRevenue: parseDecimal(invoiceStats.paid_amount),
        overdueInvoices: invoiceStats.overdue_count,
        paidInvoices: invoiceStats.paid_count,
        unpaidInvoices: invoiceStats.pending_count + invoiceStats.draft_count,
        totalProducts: productStats.total_count,
        totalInventoryValue: parseDecimal(productStats.total_inventory_value),
        monthlyExpenses,
        monthlyExpenseCount,
        currency,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRecentInvoices = (limit = 5) => {
  return useQuery({
    queryKey: ["recent-invoices", limit],
    queryFn: async (): Promise<Invoice[]> => {
      const response = await invoicesAPI.getAll({ limit, offset: 0 });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
