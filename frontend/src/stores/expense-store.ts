import { create } from 'zustand';
import { expensesAPI } from '@/lib/api';
import { Expense, ExpenseSummary, PaginatedResponse } from '@/types/api';

interface ExpenseFilters {
  category?: string;
  date_from?: string;
  date_to?: string;
  period?: 'week' | 'month' | 'year';
  reference_date?: string;
  tags?: string[];
  skip?: number;
  limit?: number;
  sort_by?: 'expense_date' | 'amount' | 'category' | 'created_at';
  sort_order?: 1 | -1;
}

interface ExpenseStore {
  // State
  expenses: Expense[];
  currentExpense: Expense | null;
  categories: string[];
  summaries: ExpenseSummary[];
  grandTotal: string;
  periodStart: string | null;
  periodEnd: string | null;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;

  // Actions
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  fetchExpenseById: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSummary: (filters?: Omit<ExpenseFilters, 'skip' | 'limit' | 'sort_by' | 'sort_order'>) => Promise<void>;
  createExpense: (data: {
    category: string;
    description: string;
    amount: string;
    currency?: string;
    vendor?: string;
    expense_date: string;
    receipt_url?: string;
    tags?: string[];
  }) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<{
    category: string;
    description: string;
    amount: string;
    currency?: string;
    vendor?: string;
    expense_date: string;
    receipt_url?: string;
    tags?: string[];
  }>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  setFilters: (filters: ExpenseFilters) => void;
  clearError: () => void;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  // Initial state
  expenses: [],
  currentExpense: null,
  categories: [],
  summaries: [],
  grandTotal: '0.00',
  periodStart: null,
  periodEnd: null,
  total: 0,
  hasMore: false,
  isLoading: false,
  error: null,
  filters: {
    skip: 0,
    limit: 20,
    sort_by: 'expense_date',
    sort_order: -1,
  },

  // Fetch expenses with filters
  fetchExpenses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await expensesAPI.getAll(mergedFilters);
      
      set({
        expenses: response.data.items,
        total: response.data.total,
        hasMore: response.data.has_more,
        filters: mergedFilters,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch expenses',
        isLoading: false,
      });
    }
  },

  // Fetch single expense
  fetchExpenseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.getById(id);
      set({ currentExpense: response.data, isLoading: false });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch expense',
        isLoading: false,
      });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const response = await expensesAPI.getCategories();
      set({ categories: response.data });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch categories',
      });
    }
  },

  // Fetch summary
  fetchSummary: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.getSummary(filters);
      set({
        summaries: response.data.summaries,
        grandTotal: response.data.grand_total,
        periodStart: response.data.period_start,
        periodEnd: response.data.period_end,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch summary',
        isLoading: false,
      });
    }
  },

  // Create expense
  createExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.create(data);
      const expense = response.data;
      
      // Optimistically add to list
      set((state) => ({
        expenses: [expense, ...state.expenses],
        total: state.total + 1,
        isLoading: false,
      }));
      
      return expense;
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || 'Failed to create expense';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Update expense
  updateExpense: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.update(id, data);
      const expense = response.data;
      
      // Update in list
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? expense : e)),
        currentExpense: state.currentExpense?.id === id ? expense : state.currentExpense,
        isLoading: false,
      }));
      
      return expense;
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || 'Failed to update expense';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Delete expense (hard delete)
  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expensesAPI.delete(id);
      
      // Remove from list
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        total: state.total - 1,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to delete expense',
        isLoading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      expenses: [],
      currentExpense: null,
      categories: [],
      summaries: [],
      grandTotal: '0.00',
      periodStart: null,
      periodEnd: null,
      total: 0,
      hasMore: false,
      isLoading: false,
      error: null,
      filters: {
        skip: 0,
        limit: 20,
        sort_by: 'expense_date',
        sort_order: -1,
      },
    }),
}));
