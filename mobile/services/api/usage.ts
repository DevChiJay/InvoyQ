import { apiClient } from "./client";
import type { Usage } from "@/types/usage";

export const usageApi = {
  get: async (): Promise<Usage> => {
    const response = await apiClient.get<Usage>("/usage");
    return response.data;
  },
};
