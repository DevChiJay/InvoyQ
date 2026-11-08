import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/lib/api";
import type { StatsTrend } from "@/types/api";

/**
 * Revenue / expense trend for the months ending at the selected month, plus daily detail.
 * No retries: if the backend predates this endpoint the charts simply don't render.
 */
export function useStatsTrend(month: number, year: number, currency: string, months = 6) {
  return useQuery<StatsTrend>({
    queryKey: ["stats-trend", month, year, currency, months],
    queryFn: async () => (await statsAPI.getTrend({ month, year, currency, months })).data.trend,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
