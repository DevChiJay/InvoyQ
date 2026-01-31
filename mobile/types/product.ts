export interface ProductOut {
  id: string;
  user_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_price: string; // Decimal as string
  tax_rate: string;
  currency: string;
  quantity_available: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_price: number;
  tax_rate?: number;
  currency?: string;
  quantity_available?: number;
  is_active?: boolean;
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductQuantityAdjustment {
  adjustment: number; // positive to add, negative to subtract
}
