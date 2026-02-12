import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/services/api/clients";
import { ClientCreate, ClientUpdate } from "@/types/client";

export const CLIENT_KEYS = {
  all: ["clients"] as const,
  list: (params: any) => ["clients", "list", params] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
  stats: ["clients", "stats"] as const,
};

export function useClients(params?: { limit?: number; skip?: number }) {
  return useQuery({
    queryKey: CLIENT_KEYS.list(params),
    queryFn: () => clientsApi.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: CLIENT_KEYS.stats,
    queryFn: () => clientsApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientCreate) => clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
      clientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CLIENT_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}
