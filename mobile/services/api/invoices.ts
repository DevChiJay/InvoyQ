import { apiClient } from './client';
import { InvoiceOut, InvoiceCreate, InvoiceUpdate, InvoiceListParams } from '@/types/invoice';

export const invoicesApi = {
  list: async (params: InvoiceListParams = {}): Promise<InvoiceOut[]> => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  get: async (id: string): Promise<InvoiceOut> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: InvoiceCreate): Promise<InvoiceOut> => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: InvoiceUpdate): Promise<InvoiceOut> => {
    const response = await apiClient.put(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  sendEmail: async (id: string, email: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/invoices/${id}/send`, { email });
    return response.data;
  },
};
