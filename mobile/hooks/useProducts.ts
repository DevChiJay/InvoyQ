import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { productsApi } from "@/services/api/products";
import {
  ProductCreate,
  ProductUpdate,
  ProductQuantityAdjustment,
} from "@/types/product";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
  list: (params: any) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  stats: ["products", "stats"] as const,
};

export function useProducts(params?: {
  is_active?: boolean;
  search?: string;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: ({ pageParam = 0 }) =>
      productsApi.list({
        ...params,
        skip: pageParam,
        limit: params?.limit || 50,
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextSkip = pages.length * (params?.limit || 50);
      return lastPage.has_more ? nextSkip : undefined;
    },
    initialPageParam: 0,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: PRODUCT_KEYS.stats,
    queryFn: () => productsApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.detail(variables.id),
      });
    },
  });
}

export function useAdjustProductQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) =>
      productsApi.adjustQuantity(id, { adjustment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}
