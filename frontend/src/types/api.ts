// User Types
export interface User {
  id: string;  // MongoDB ObjectId
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;  // NEW - email verification status
  is_pro: boolean;
  subscription_status: string | null;
  subscription_provider: string | null;  // NEW
  subscription_start_date: string | null;  // NEW
  subscription_end_date: string | null;  // NEW
  // Business/Profile details
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  company_address: string | null;
  tax_id: string | null;
  website: string | null;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  company_name?: string;
  company_logo_url?: string;
  company_address?: string;
  tax_id?: string;
  website?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;  // OAuth2 uses 'username' field (but we send email)
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

// Client Types
export interface Client {
  id: string;  // MongoDB ObjectId
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ClientCreate {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Invoice Types
export interface UserBusinessInfo {
  full_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  company_logo_url?: string;
  company_address?: string;
  tax_id?: string;
  website?: string;
}

export interface InvoiceItem {
  product_id: string | null;  // NEW - reference to product
  description: string;
  quantity: string;  // Decimal as string
  unit_price: string;  // Decimal as string
  tax_rate: string;  // Decimal as string (percentage)
  amount: string;  // Decimal as string
}

export interface InvoiceEvent {
  action: string;  // 'created' | 'sent' | 'paid' | 'status_changed' | 'updated' | 'deleted'
  timestamp: string;  // ISO datetime
  details: Record<string, unknown>;
}

export interface Invoice {
  id: string;  // MongoDB ObjectId
  user_id: string;  // MongoDB ObjectId
  client_id: string;  // MongoDB ObjectId
  number: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_date: string | null;  // YYYY-MM-DD
  due_date: string | null;  // YYYY-MM-DD
  currency: string;  // ISO 4217 (NGN, USD, etc.)
  subtotal: string | null;  // Decimal as string
  tax: string | null;  // Decimal as string
  total: string | null;  // Decimal as string
  notes: string | null;
  pdf_url: string | null;
  payment_link: string | null;
  items: InvoiceItem[];
  events: InvoiceEvent[];  // NEW - audit trail
  user_business_info: UserBusinessInfo | null;  // NEW
  created_at: string;  // ISO datetime
  updated_at: string;  // ISO datetime
}

export interface ProductItemReference {
  product_id: string;
  quantity: string;  // Decimal as string
}

export interface InvoiceCreate {
  client_id: string;  // MongoDB ObjectId
  number?: string;
  status?: string;
  issued_date?: string;
  due_date?: string;
  currency?: string;
  subtotal?: string;  // Decimal as string
  tax?: string;  // Decimal as string
  total?: string;  // Decimal as string
  notes?: string;
  payment_link?: string;
  items?: InvoiceItem[];  // manual items
  product_items?: ProductItemReference[];  // NEW - products from catalog
}

export interface InvoiceUpdate {
  client_id?: string;  // MongoDB ObjectId
  number?: string;
  status?: string;
  issued_date?: string;
  due_date?: string;
  currency?: string;
  subtotal?: string;  // Decimal as string
  tax?: string;  // Decimal as string
  total?: string;  // Decimal as string
  notes?: string;
  pdf_url?: string;
  payment_link?: string;
  items?: InvoiceItem[];  // Replace all items if provided
}

export interface InvoiceListParams {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  client_id?: string;  // MongoDB ObjectId
  limit?: number;
  offset?: number;
  due_from?: string;
  due_to?: string;
}

// Extraction Types - Backend Response Format
export interface BackendExtractionData {
  jobs?: string[];
  deadlines?: string[];
  payment_terms?: string | null;
  amount?: number | null;
  currency?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  confidence?: number;
}

export interface BackendExtractionResponse {
  extraction_id: string;  // MongoDB ObjectId
  parsed: BackendExtractionData;
}

// Frontend Display Format (transformed from backend)
export interface ExtractedData {
  client?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  invoice_details?: {
    number?: string;
    issued_date?: string;
    due_date?: string;
  };
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount?: number;
  }>;
  financial?: {
    subtotal?: number;
    tax?: number;
    total?: number;
  };
  notes?: string;
  confidence?: number;
}

export interface ExtractionResponse {
  extraction_id: string;  // MongoDB ObjectId
  parsed: ExtractedData;
}

// Payment Types
export interface Payment {
  id: string;  // MongoDB ObjectId
  payment_type: string;
  amount: number;
  currency: string;
  provider: string;
  provider_ref: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SubscriptionStatus {
  is_pro: boolean;
  subscription_status: string | null;
  subscription_provider: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  days_remaining: number | null;
}

// Dashboard Types
export interface DashboardStats {
  total_clients: number;
  total_invoices: number;
  total_revenue: number;
  pending_amount: number;
  overdue_invoices: number;
}

// API Error Response
export interface APIError {
  detail: string | { msg: string; type: string }[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Product Types (NEW)
export interface Product {
  id: string;  // MongoDB ObjectId
  user_id: string;  // MongoDB ObjectId
  sku: string;  // unique per user, max 100 chars
  name: string;  // max 255 chars
  description: string | null;  // max 1000 chars
  unit_price: string;  // Decimal as string
  tax_rate: string;  // Decimal as string (percentage, 0-100)
  currency: string;  // ISO 4217, uppercase
  quantity_available: number;  // integer
  is_active: boolean;
  created_at: string;  // ISO datetime
  updated_at: string;  // ISO datetime
}

export interface ProductCreate {
  sku: string;
  name: string;
  description?: string;
  unit_price: string;  // Decimal as string
  tax_rate?: string;  // Default "0.00"
  currency?: string;  // Default "NGN"
  quantity_available?: number;  // Default 0
  is_active?: boolean;  // Default true
}

export interface ProductUpdate {
  sku?: string;
  name?: string;
  description?: string;
  unit_price?: string;  // Decimal as string
  tax_rate?: string;
  currency?: string;
  quantity_available?: number;
  is_active?: boolean;
}

export interface ProductQuantityAdjustment {
  adjustment: number;  // positive or negative, non-zero
}

export type ProductListResponse = PaginatedResponse<Product>;

// Expense Types (NEW)
export interface Expense {
  id: string;  // MongoDB ObjectId
  user_id: string;  // MongoDB ObjectId
  category: string;  // lowercase, max 100 chars
  description: string;  // max 500 chars
  amount: string;  // Decimal as string
  currency: string;  // ISO 4217, uppercase
  vendor: string | null;  // max 255 chars
  expense_date: string;  // YYYY-MM-DD
  receipt_url: string | null;  // max 500 chars
  tags: string[];  // lowercase, trimmed, deduplicated
  created_at: string;  // ISO datetime
  updated_at: string;  // ISO datetime
}

export interface ExpenseCreate {
  category: string;  // auto-lowercased
  description: string;
  amount: string;  // Decimal as string, must be > 0
  currency?: string;  // Default "NGN"
  vendor?: string;
  expense_date: string;  // YYYY-MM-DD
  receipt_url?: string;
  tags?: string[];  // auto-lowercased, trimmed, deduplicated
}

export interface ExpenseUpdate {
  category?: string;
  description?: string;
  amount?: string;  // Decimal as string
  currency?: string;
  vendor?: string;
  expense_date?: string;  // YYYY-MM-DD
  receipt_url?: string;
  tags?: string[];
}

export interface ExpenseSummary {
  category: string;
  total_amount: string;  // Decimal as string
  count: number;
  currency: string;
}

export interface ExpenseSummaryResponse {
  summaries: ExpenseSummary[];
  grand_total: string;  // Decimal as string
  period_start: string | null;  // YYYY-MM-DD
  period_end: string | null;  // YYYY-MM-DD
}

export type ExpenseListResponse = PaginatedResponse<Expense>;

// Common expense categories for autocomplete
export const EXPENSE_CATEGORIES = [
  'office',
  'travel',
  'utilities',
  'software',
  'hardware',
  'supplies',
  'rent',
  'salaries',
  'marketing',
  'meals',
  'transportation',
  'professional_services',
  'insurance',
  'taxes',
  'maintenance',
  'other',
] as const;
