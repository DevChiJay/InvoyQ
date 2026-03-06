import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/lib/api";
import type { MonthlyStats } from "@/types/api";

export interface UseMonthlyStatsReturn {
  // Data
  stats: MonthlyStats | undefined;
  isLoading: boolean;
  error: Error | null;

  // State
  month: number;
  year: number;
  currency: string;

  // Navigation helpers
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  setMonthYear: (month: number, year: number) => void;
  isCurrentMonth: boolean;
}

export const useMonthlyStats = (
  initialCurrency: string = "NGN",
): UseMonthlyStatsReturn => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [year, setYear] = useState(now.getFullYear());
  const [currency] = useState(initialCurrency);

  const { data, isLoading, error } = useQuery({
    queryKey: ["monthly-stats", month, year, currency],
    queryFn: async () => {
      const response = await statsAPI.getMonthlyStats({
        month,
        year,
        currency,
      });
      return response.data.stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  const setMonthYear = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  return {
    stats: data,
    isLoading,
    error: error as Error | null,
    month,
    year,
    currency,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setMonthYear,
    isCurrentMonth,
  };
};
