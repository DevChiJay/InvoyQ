import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { invoicesAPI } from "@/lib/api";
import type {
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceListParams,
} from "@/types/api";
import { toast } from "sonner";
import { formatErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 50;

export const useInvoices = (params?: InvoiceListParams) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const response = await invoicesAPI.getAll(params);
      return response.data;
    },
  });
};

export const useInfiniteInvoices = (
  params?: Omit<InvoiceListParams, "skip" | "limit">,
) => {
  return useInfiniteQuery({
    queryKey: ["invoices", "infinite", params],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await invoicesAPI.getAll({
        ...params,
        limit: PAGE_SIZE,
        skip: pageParam as number,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.offset + lastPage.items.length : undefined,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const response = await invoicesAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceCreate) => invoicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to create invoice",
      );
      toast.error(message);
    },
  });
};

export const useUpdateInvoice = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceUpdate) => invoicesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-invoices"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to update invoice",
      );
      toast.error(message);
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to delete invoice",
      );
      toast.error(message);
    },
  });
};

export const useSendInvoiceEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email }: { id: string; email?: string }) =>
      invoicesAPI.sendEmail(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice sent successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to send invoice",
      );
      toast.error(message);
    },
  });
};
