import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi, MonthlyStats } from "@/services/api/stats";

export function useMonthlyStats(initialMonth?: number, initialYear?: number) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth || now.getMonth() + 1);
  const [year, setYear] = useState(initialYear || now.getFullYear());
  const [currency] = useState("NGN"); // Can be made configurable if needed

  const { data, isLoading, error, refetch } = useQuery<MonthlyStats>({
    queryKey: ["monthly-stats", month, year, currency],
    queryFn: () => statsApi.getMonthlyStats({ month, year, currency }),
    staleTime: 5 * 60 * 1000, // 5 minutes - monthly data doesn't change often
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

  return {
    stats: data,
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
  };
}
