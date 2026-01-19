import { z } from 'zod';

// Client Validation Schemas
export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

// Invoice Item Schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid quantity').refine((val) => parseFloat(val) > 0, 'Quantity must be greater than 0'),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price').refine((val) => parseFloat(val) >= 0, 'Price must be positive'),
  tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid tax rate').optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount').refine((val) => parseFloat(val) >= 0, 'Amount must be positive'),
});

// Invoice Validation Schemas
export const invoiceCreateSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),  // MongoDB ObjectId as string
  issued_date: z.string().min(1, 'Issued date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid tax').refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }, 'Tax must be between 0 and 100%').optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Ensure due date is after issued date
  const issued = new Date(data.issued_date);
  const due = new Date(data.due_date);
  return due >= issued;
}, {
  message: 'Due date must be on or after issued date',
  path: ['due_date'],
});

export const invoiceUpdateSchema = z.object({
  client_id: z.string().min(1, 'Client is required').optional(),  // MongoDB ObjectId as string
  issued_date: z.string().optional(),
  due_date: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required').optional(),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid tax').refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }, 'Tax must be between 0 and 100%').optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
});

// Auth Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/\d/, 'Password must contain at least 1 number'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
});

// Product Validation Schemas (NEW)
export const productCreateSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters').trim(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().or(z.literal('')),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').refine((val) => parseFloat(val) > 0, 'Price must be greater than 0'),
  tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid tax rate format').refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }, 'Tax rate must be between 0 and 100').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase().optional(),
  quantity_available: z.number().int().min(0, 'Quantity must be positive').optional(),
  is_active: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productQuantityAdjustmentSchema = z.object({
  adjustment: z.number().int().refine((val) => val !== 0, 'Adjustment cannot be zero'),
});

// Expense Validation Schemas (NEW)
export const expenseCreateSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters').toLowerCase().trim(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase().optional(),
  vendor: z.string().max(255, 'Vendor must be less than 255 characters').optional().or(z.literal('')),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  receipt_url: z.string().url('Invalid URL').max(500, 'URL must be less than 500 characters').optional().or(z.literal('')),
  tags: z.array(z.string().toLowerCase().trim()).optional(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

// Export types
export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQuantityAdjustmentInput = z.infer<typeof productQuantityAdjustmentSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
