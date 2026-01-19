import { create } from 'zustand';
import { productsAPI } from '@/lib/api';
import { Product, PaginatedResponse } from '@/types/api';

interface ProductFilters {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
  sort_by?: 'name' | 'sku' | 'unit_price' | 'quantity_available' | 'created_at';
  sort_order?: 1 | -1;
}

interface ProductStore {
  // State
  products: Product[];
  currentProduct: Product | null;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  createProduct: (data: {
    sku: string;
    name: string;
    description?: string;
    unit_price: string;
    tax_rate?: string;
    currency?: string;
    quantity_available?: number;
    is_active?: boolean;
  }) => Promise<Product>;
  updateProduct: (id: string, data: Partial<{
    sku: string;
    name: string;
    description?: string;
    unit_price: string;
    tax_rate?: string;
    currency?: string;
    quantity_available?: number;
    is_active?: boolean;
  }>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  adjustQuantity: (id: string, adjustment: number) => Promise<Product>;
  setFilters: (filters: ProductFilters) => void;
  clearError: () => void;
  reset: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  total: 0,
  hasMore: false,
  isLoading: false,
  error: null,
  filters: {
    skip: 0,
    limit: 20,
    sort_by: 'created_at',
    sort_order: -1,
  },

  // Fetch products with filters
  fetchProducts: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await productsAPI.getAll(mergedFilters);
      
      set({
        products: response.data.items,
        total: response.data.total,
        hasMore: response.data.has_more,
        filters: mergedFilters,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  // Fetch single product
  fetchProductById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsAPI.getById(id);
      set({ currentProduct: response.data, isLoading: false });
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to fetch product',
        isLoading: false,
      });
    }
  },

  // Create product
  createProduct: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsAPI.create(data);
      const product = response.data;
      
      // Optimistically add to list
      set((state) => ({
        products: [product, ...state.products],
        total: state.total + 1,
        isLoading: false,
      }));
      
      return product;
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || 'Failed to create product';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Update product
  updateProduct: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsAPI.update(id, data);
      const product = response.data;
      
      // Update in list
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? product : p)),
        currentProduct: state.currentProduct?.id === id ? product : state.currentProduct,
        isLoading: false,
      }));
      
      return product;
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || 'Failed to update product';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Delete product (soft delete - marks as inactive)
  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productsAPI.delete(id);
      
      // Mark as inactive in the list
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, is_active: false } : p
        ),
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: (error as any).response?.data?.detail || 'Failed to delete product',
        isLoading: false,
      });
      throw error;
    }
  },

  // Adjust quantity
  adjustQuantity: async (id, adjustment) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsAPI.adjustQuantity(id, { adjustment });
      const product = response.data;
      
      // Update in list
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? product : p)),
        currentProduct: state.currentProduct?.id === id ? product : state.currentProduct,
        isLoading: false,
      }));
      
      return product;
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || 'Failed to adjust quantity';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
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
      products: [],
      currentProduct: null,
      total: 0,
      hasMore: false,
      isLoading: false,
      error: null,
      filters: {
        skip: 0,
        limit: 20,
        sort_by: 'created_at',
        sort_order: -1,
      },
    }),
}));
