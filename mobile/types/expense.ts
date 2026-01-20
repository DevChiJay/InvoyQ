export interface ExpenseOut {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  vendor: string | null;
  expense_date: string;
  receipt_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  vendor?: string;
  expense_date: string;
  receipt_url?: string;
  tags?: string[];
}

export interface ExpenseUpdate extends Partial<ExpenseCreate> {}

export interface ExpenseSummary {
  category: string;
  total_amount: string;
  count: number;
  currency: string;
}

export interface ExpenseListParams {
  category?: string;
  date_from?: string;
  date_to?: string;
  period?: 'week' | 'month' | 'year';
  tags?: string[];
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 1 | -1;
}
