import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi, MonthlyStats, StatsTrend } from "@/services/api/stats";

export const STATS_KEYS = {
  all: ["stats"] as const,
  monthly: (month: number, year: number, currency: string) =>
    ["stats", "monthly", month, year, currency] as const,
  trend: (month: number, year: number, currency: string) =>
    ["stats", "trend", month, year, currency] as const,
};

export function useMonthlyStats(initialMonth?: number, initialYear?: number) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth || now.getMonth() + 1);
  const [year, setYear] = useState(initialYear || now.getFullYear());
  const [currency] = useState("NGN"); // Can be made configurable if needed

  const { data, isLoading, error, refetch } = useQuery<MonthlyStats>({
    queryKey: STATS_KEYS.monthly(month, year, currency),
    queryFn: () => statsApi.getMonthlyStats({ month, year, currency }),
    staleTime: 5 * 60 * 1000, // 5 minutes - monthly data doesn't change often
  });

  // The trend is an extra on top of the monthly numbers: if it fails the
  // screen still renders, so no retry and no error surfaced.
  const {
    data: trend,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useQuery<StatsTrend>({
    queryKey: STATS_KEYS.trend(month, year, currency),
    queryFn: () => statsApi.getTrend({ month, year, currency, months: 6 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
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
    const current = new Date();
    setMonth(current.getMonth() + 1);
    setYear(current.getFullYear());
  };

  const setMonthYear = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const isCurrentMonth = () => {
    return month === now.getMonth() + 1 && year === now.getFullYear();
  };

  const refetchAll = async () => {
    await Promise.all([refetch(), refetchTrend()]);
  };

  return {
    stats: data,
    trend,
    trendLoading,
    isLoading,
    error,
    month,
    year,
    currency,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setMonthYear,
    isCurrentMonth: isCurrentMonth(),
    refetch,
    refetchAll,
  };
}
