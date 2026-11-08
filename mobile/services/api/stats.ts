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
  /** Only statuses that occur are present; a missing key means 0. */
  status_counts?: Record<string, number>;
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

export interface TrendPoint {
  month: number;
  year: number;
  revenue: string;
  expenses: string;
  net_income: string;
  total_invoices: number;
  paid_invoices: number;
}

export interface DailyPoint {
  date: string;
  revenue: string;
  expenses: string;
}

export interface StatsTrend {
  currency: string;
  month: number;
  year: number;
  /** Oldest first, zero-filled, ending at the selected month. */
  months: TrendPoint[];
  /** One entry per day of the selected month. */
  daily: DailyPoint[];
}

export interface StatsTrendParams extends MonthlyStatsParams {
  months?: number;
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

  getTrend: async (params: StatsTrendParams): Promise<StatsTrend> => {
    const response = await apiClient.get<{ trend: StatsTrend }>("/stats/trend", {
      params: {
        month: params.month,
        year: params.year,
        currency: params.currency || "NGN",
        months: params.months ?? 6,
      },
    });
    return response.data.trend;
  },
};
