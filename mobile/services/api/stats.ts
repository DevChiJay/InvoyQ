import { apiClient } from "./client";

export interface TopProduct {
  product_id: string | null;
  name: string;
  quantity_sold: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  currency: string;
  total_revenue: string;
  total_expenses: string;
  net_income: string;
  total_invoices: number;
  paid_invoices: number;
  unpaid_invoices: number;
  total_products_sold: number;
  top_products: TopProduct[];
  new_clients: number;
  period_start: string;
  period_end: string;
}

export interface MonthlyStatsResponse {
  stats: MonthlyStats;
}

export interface MonthlyStatsParams {
  month: number;
  year: number;
  currency?: string;
}

export const statsApi = {
  getMonthlyStats: async (
    params: MonthlyStatsParams,
  ): Promise<MonthlyStats> => {
    const response = await apiClient.get<MonthlyStatsResponse>(
      "/stats/monthly",
      {
        params: {
          month: params.month,
          year: params.year,
          currency: params.currency || "NGN",
        },
      },
    );
    return response.data.stats;
  },
};
