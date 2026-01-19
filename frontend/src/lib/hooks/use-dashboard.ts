import { useQuery } from '@tanstack/react-query';
import { clientsAPI, invoicesAPI, productsAPI, expensesAPI } from '@/lib/api';
import type { Invoice } from '@/types/api';
import { parseDecimal } from '@/lib/format';
import { formatDateToYYYYMMDD } from '@/lib/utils';

export interface DashboardStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalProducts?: number;
  totalInventoryValue?: number;
  monthlyExpenses?: number;
  monthlyExpenseCount?: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all data in parallel
      const [clientsResponse, invoicesResponse, productsResponse, expensesResponse] = await Promise.all([
        clientsAPI.getAll(),
        invoicesAPI.getAll(),
        productsAPI.getAll({ is_active: true, limit: 100 }).catch((err) => {
          console.error('Failed to fetch products:', err);
          return { data: { items: [], total: 0, has_more: false, limit: 0, offset: 0 } };
        }),
        expensesAPI.getSummary({ 
          period: 'month', 
          reference_date: formatDateToYYYYMMDD(new Date()) 
        }).catch((err) => {
          console.error('Failed to fetch expense summary:', err);
          return { data: { summaries: [], grand_total: '0.00', period_start: null, period_end: null } };
        }),
      ]);

      const clients = clientsResponse.data;
      const invoices = invoicesResponse.data;
      const products = productsResponse.data.items || [];
      const expenseSummary = expensesResponse.data;

      console.log('Dashboard Stats Debug:', {
        clientsCount: clients.length,
        invoicesCount: invoices.length,
        productsResponse: productsResponse.data,
        productsCount: products.length,
        expenseSummary,
        expenseSummaryGrandTotal: expenseSummary.grand_total,
      });

      // Calculate invoice stats
      const totalRevenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseDecimal(inv.total), 0);

      const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;
      const unpaidInvoices = invoices.filter(
        (inv) => inv.status === 'sent' || inv.status === 'draft'
      ).length;

      // Calculate product stats
      const totalProducts = products.length;
      const totalInventoryValue = products.reduce(
        (sum, product) => sum + (parseDecimal(product.unit_price) * product.quantity_available),
        0
      );

      // Calculate expense stats - parse the decimal string correctly
      const monthlyExpenses = parseDecimal(expenseSummary.grand_total);
      const monthlyExpenseCount = expenseSummary.summaries?.reduce(
        (sum, summary) => sum + summary.count,
        0
      ) || 0;

      console.log('Calculated Stats:', {
        totalProducts,
        totalInventoryValue,
        monthlyExpenses,
        monthlyExpenseCount,
      });

      return {
        totalClients: clients.length,
        totalInvoices: invoices.length,
        totalRevenue,
        overdueInvoices,
        paidInvoices,
        unpaidInvoices,
        totalProducts,
        totalInventoryValue,
        monthlyExpenses,
        monthlyExpenseCount,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRecentInvoices = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-invoices', limit],
    queryFn: async (): Promise<Invoice[]> => {
      const response = await invoicesAPI.getAll({ limit, offset: 0 });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
