import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractionApi } from "@/services/api/extraction";
import { transformExtraction } from "@/utils/extractionTransformer";
import type { ExtractionInput, InvoicePrefill } from "@/types/extraction";
import { USAGE_KEYS } from "./useUsage";

export function useExtraction() {
  const queryClient = useQueryClient();
  return useMutation<InvoicePrefill, unknown, ExtractionInput>({
    mutationFn: async (input) =>
      transformExtraction(await extractionApi.extract(input)),
    // Success or failure, refetch usage: the server refunds a failed call.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USAGE_KEYS.all });
    },
    // A retry would double-spend an extraction attempt.
    retry: false,
  });
}
