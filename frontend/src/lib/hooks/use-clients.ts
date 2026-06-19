import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { clientsAPI } from "@/lib/api";
import type { ClientCreate, ClientUpdate } from "@/types/api";
import { toast } from "sonner";
import { formatErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 50;

export const useClients = (limit?: number, skip?: number) => {
  return useQuery({
    queryKey: ["clients", { limit, skip }],
    queryFn: async () => {
      const response = await clientsAPI.getAll(limit, skip);
      return response.data;
    },
  });
};

export const useInfiniteClients = (search?: string) => {
  return useInfiniteQuery({
    queryKey: ["clients", "infinite", search],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await clientsAPI.getAll(
        PAGE_SIZE,
        pageParam as number,
        search,
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });
};

export const useClientSearch = (search: string) => {
  return useQuery({
    queryKey: ["clients", "search", search],
    queryFn: async () => {
      const response = await clientsAPI.getAll(20, 0, search);
      return response.data;
    },
    enabled: search.length > 0,
    staleTime: 30 * 1000,
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const response = await clientsAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreate) => clientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Client created successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to create client",
      );
      toast.error(message);
    },
  });
};

export const useUpdateClient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientUpdate) => clientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      toast.success("Client updated successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to update client",
      );
      toast.error(message);
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Client deleted successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(
        err.response?.data?.detail,
        "Failed to delete client",
      );
      toast.error(message);
    },
  });
};
