import { apiClient } from './client';
import { ExpenseOut, ExpenseCreate, ExpenseUpdate, ExpenseSummary, ExpenseListParams } from '@/types/expense';

export const expensesApi = {
  list: async (params: ExpenseListParams = {}): Promise<{
    items: ExpenseOut[];
    total: number;
    grand_total: string;
  }> => {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  get: async (id: string): Promise<ExpenseOut> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: ExpenseCreate): Promise<ExpenseOut> => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: ExpenseUpdate): Promise<ExpenseOut> => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  getSummary: async (params: ExpenseListParams = {}): Promise<{
    items: ExpenseSummary[];
    grand_total: string;
    currency: string;
  }> => {
    const response = await apiClient.get('/expenses/summary', { params });
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/expenses/categories');
    return response.data;
  },

  uploadReceipt: async (expenseId: string, file: FormData): Promise<{ url: string }> => {
    const response = await apiClient.post(`/expenses/${expenseId}/upload-receipt`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
