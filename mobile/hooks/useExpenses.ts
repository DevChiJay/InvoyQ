import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '@/services/api/expenses';
import { ExpenseCreate, ExpenseUpdate, ExpenseListParams } from '@/types/expense';

export const EXPENSE_KEYS = {
  all: ['expenses'] as const,
  list: (params: ExpenseListParams) => ['expenses', 'list', params] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
  categories: ['expenses', 'categories'] as const,
  summary: (params: ExpenseListParams) => ['expenses', 'summary', params] as const,
};

export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: EXPENSE_KEYS.list(params || {}),
    queryFn: () => expensesApi.list(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: EXPENSE_KEYS.detail(id),
    queryFn: () => expensesApi.get(id),
    enabled: !!id,
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: EXPENSE_KEYS.categories,
    queryFn: () => expensesApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useExpenseSummary(params?: ExpenseListParams) {
  return useQuery({
    queryKey: EXPENSE_KEYS.summary(params || {}),
    queryFn: () => expensesApi.getSummary(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdate }) =>
      expensesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}
