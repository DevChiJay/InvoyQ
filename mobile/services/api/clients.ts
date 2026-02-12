import { apiClient } from "./client";
import {
  ClientOut,
  ClientCreate,
  ClientUpdate,
  ClientStatsResponse,
} from "@/types/client";

export const clientsApi = {
  list: async (
    params: { limit?: number; skip?: number; search?: string } = {},
  ): Promise<ClientOut[]> => {
    const response = await apiClient.get("/clients", { params });
    return response.data;
  },

  get: async (id: string): Promise<ClientOut> => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data: ClientCreate): Promise<ClientOut> => {
    const response = await apiClient.post("/clients", data);
    return response.data;
  },

  update: async (id: string, data: ClientUpdate): Promise<ClientOut> => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },

  getStats: async (): Promise<ClientStatsResponse> => {
    const response = await apiClient.get("/clients/stats");
    return response.data;
  },
};
