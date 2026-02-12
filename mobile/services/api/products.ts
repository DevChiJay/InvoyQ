import { apiClient } from "./client";
import {
  ProductOut,
  ProductCreate,
  ProductUpdate,
  ProductQuantityAdjustment,
  ProductStatsResponse,
} from "@/types/product";
import { PaginatedResponse } from "@/types/api";

export const productsApi = {
  list: async (
    params: {
      is_active?: boolean;
      search?: string;
      skip?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: number;
    } = {},
  ): Promise<PaginatedResponse<ProductOut>> => {
    const response = await apiClient.get("/products", { params });
    return response.data;
  },

  get: async (id: string): Promise<ProductOut> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<ProductOut> => {
    const response = await apiClient.post("/products", data);
    return response.data;
  },

  update: async (id: string, data: ProductUpdate): Promise<ProductOut> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  adjustQuantity: async (
    id: string,
    data: ProductQuantityAdjustment,
  ): Promise<ProductOut> => {
    const response = await apiClient.patch(
      `/products/${id}/adjust-quantity`,
      data,
    );
    return response.data;
  },

  getStats: async (): Promise<ProductStatsResponse> => {
    const response = await apiClient.get("/products/stats");
    return response.data;
  },
};
