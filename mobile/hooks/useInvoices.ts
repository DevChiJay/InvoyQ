import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/services/api/invoices";
import {
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceListParams,
  InvoiceStatsParams,
} from "@/types/invoice";
import { PRODUCT_KEYS } from "./useProducts";

export const INVOICE_KEYS = {
  all: ["invoices"] as const,
  list: (params: InvoiceListParams) => ["invoices", "list", params] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
  stats: (params: InvoiceStatsParams) => ["invoices", "stats", params] as const,
};

export function useInvoices(params?: InvoiceListParams) {
  return useQuery({
    queryKey: INVOICE_KEYS.list(params || {}),
    queryFn: () => invoicesApi.list(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}

export function useInvoiceStats(params?: InvoiceStatsParams) {
  return useQuery({
    queryKey: INVOICE_KEYS.stats(params || {}),
    queryFn: () => invoicesApi.getStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceCreate) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      // Also invalidate products if product_items were used
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdate }) =>
      invoicesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: INVOICE_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
    },
  });
}

export function useSendInvoiceEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email?: string }) =>
      invoicesApi.sendEmail(id, email || ""),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: INVOICE_KEYS.detail(variables.id),
      });
    },
  });
}
