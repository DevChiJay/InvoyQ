import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  unit_price: z.number().positive('Price must be positive'),
  tax_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  quantity_available: z.number().int().min(0).optional(),
});

export const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional(),
  vendor: z.string().optional(),
  expense_date: z.string(),
  tags: z.array(z.string()).optional(),
});

export const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  number: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  issued_date: z.string().optional(),
  due_date: z.string().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
});
