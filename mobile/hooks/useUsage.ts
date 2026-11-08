import { useQuery } from "@tanstack/react-query";
import { usageApi } from "@/services/api/usage";

export const USAGE_KEYS = {
  all: ["usage"] as const,
};

export function useUsage() {
  return useQuery({
    queryKey: USAGE_KEYS.all,
    queryFn: usageApi.get,
    staleTime: 30 * 1000,
  });
}
