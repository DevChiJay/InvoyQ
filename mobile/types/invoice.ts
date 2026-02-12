import { ClientOut } from "./client";
import { UserBusinessInfo } from "./auth";

export interface InvoiceItemOut {
  product_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  amount: string;
}

export interface InvoiceOut {
  id: string;
  user_id: string;
  client_id: string;
  number: string | null;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_date: string | null;
  due_date: string | null;
  currency: string;
  discount: string;
  subtotal: string | null;
  tax: string | null;
  total: string | null;
  notes: string | null;
  items: InvoiceItemOut[];
  client: ClientOut | null;
  user_business_info: UserBusinessInfo | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  client_id: string;
  number?: string;
  status?: string;
  issued_date?: string;
  due_date?: string;
  currency?: string;
  discount?: number;
  notes?: string;
  items?: InvoiceItemCreate[];
  product_items?: ProductItemReference[];
}

export interface InvoiceUpdate extends Partial<InvoiceCreate> {}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

export interface ProductItemReference {
  product_id: string;
  quantity: number;
}

export interface InvoiceListParams {
  limit?: number;
  skip?: number;
  status?: string;
  client_id?: string;
  due_from?: string;
  due_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 1 | -1;
}

export interface InvoiceStats {
  total_revenue: string;
  paid_amount: string;
  pending_amount: string;
  draft_amount: string;
  overdue_amount: string;
  cancelled_amount: string;
  total_count: number;
  paid_count: number;
  pending_count: number;
  draft_count: number;
  overdue_count: number;
  cancelled_count: number;
  currency: string;
}

export interface InvoiceStatsResponse {
  stats: InvoiceStats;
  by_currency?: InvoiceStats[];
  date_from?: string;
  date_to?: string;
}

export interface InvoiceStatsParams {
  date_from?: string;
  date_to?: string;
  currency?: string;
}
