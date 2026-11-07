import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usageAPI } from "@/lib/api";
import type { Usage } from "@/types/api";

export const USAGE_QUERY_KEY = ["usage"] as const;

/** This month's invoice / extraction usage and the plan limits (null limit = unlimited). */
export function useUsage() {
  return useQuery<Usage>({
    queryKey: USAGE_QUERY_KEY,
    queryFn: async () => (await usageAPI.get()).data,
    // Usage changes whenever something is created, so don't serve a long-lived cache.
    staleTime: 30_000,
    retry: 1,
  });
}

/** Call after something that uses the allowance (an invoice is created, an extraction runs). */
export function useInvalidateUsage() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY });
}
