import axios from 'axios';
import type {
  User,
  UserUpdate,
  Client,
  ClientCreate,
  ClientUpdate,
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceListParams,
  BackendExtractionResponse,
  SubscriptionStatus,
  Payment,
  AuthResponse,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductQuantityAdjustment,
  ProductListResponse,
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseListResponse,
  ExpenseSummaryResponse,
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle common errors and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh is complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) => {
    // Backend uses OAuth2PasswordRequestForm which expects form data with 'username' and 'password'
    const formData = new URLSearchParams();
    formData.append('username', email);  // OAuth2 uses 'username' field
    formData.append('password', password);
    
    return api.post<AuthResponse>('/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  register: (email: string, password: string, full_name: string) =>
    api.post<User>('/v1/auth/register', { email, password, full_name }),
  
  // Email verification (NEW)
  verifyEmail: (token: string) =>
    api.get<{ message: string; email: string }>('/v1/auth/verify-email', { params: { token } }),
  
  resendVerification: (email: string) =>
    api.post<{ message: string }>('/v1/auth/resend-verification', { email }),
  
  // Password reset
  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>('/v1/auth/request-password-reset', { email }),
  
  resetPassword: (token: string, new_password: string) =>
    api.post<{ message: string }>('/v1/auth/reset-password', { token, new_password }),
  
  // Google OAuth (NEW)
  googleAuth: (token: string) =>
    api.post<AuthResponse>('/v1/auth/google', { token }),
  
  getCurrentUser: () =>
    api.get<User>('/v1/me'),
};

export const usersAPI = {
  getMe: () =>
    api.get<User>('/v1/me'),
  
  updateProfile: (data: UserUpdate) =>
    api.patch<User>('/v1/me', data),
  
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; message: string }>('/v1/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; message: string }>('/v1/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ message: string }>('/v1/change-password', {
      current_password,
      new_password,
    }),
};

export const clientsAPI = {
  getAll: (limit?: number, offset?: number) =>
    api.get<Client[]>('/v1/clients', { params: { limit, offset } }),
  
  getById: (id: string) =>
    api.get<Client>(`/v1/clients/${id}`),
  
  create: (data: ClientCreate) =>
    api.post<Client>('/v1/clients', data),
  
  update: (id: string, data: ClientUpdate) =>
    api.put<Client>(`/v1/clients/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/v1/clients/${id}`),
};

export const invoicesAPI = {
  getAll: (params?: InvoiceListParams) =>
    api.get<Invoice[]>('/v1/invoices', { params }),
  
  getById: (id: string) =>
    api.get<Invoice>(`/v1/invoices/${id}`),
  
  create: (data: InvoiceCreate) =>
    api.post<Invoice>('/v1/invoices', data),
  
  update: (id: string, data: InvoiceUpdate) =>
    api.put<Invoice>(`/v1/invoices/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/v1/invoices/${id}`),
  
  sendEmail: (id: string, email?: string) =>
    api.post<{ message: string }>(`/v1/invoices/${id}/send`, { email }),
};

export const generateAPI = {
  generateInvoice: (data: {
    client_id: string;
    extraction_id?: string;
    items?: Array<{
      description: string;
      quantity: string;
      unit_price: string;
      amount?: string;
    }>;
    issued_date?: string;
    due_date?: string;
    subtotal?: string;
    tax?: string;
    total?: string;
    number?: string;
    payment_provider?: 'paystack' | 'stripe';
    payment_link?: string;
    currency?: string;
  }) =>
    api.post<Invoice>('/v1/generate-invoice', data),
};

export const extractionAPI = {
  extractJobDetails: (formData: FormData) =>
    api.post<BackendExtractionResponse>('/v1/extract-job-details', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const paymentsAPI = {
  createSubscription: (data: { provider: 'paystack' | 'stripe'; currency: string; callback_url?: string }) =>
    api.post<{ payment_url: string; reference: string }>('/v1/payments/subscription/create', data),
  
  verifyPayment: (data: { reference: string; provider: 'paystack' | 'stripe' }) =>
    api.post<{ message: string; is_pro: boolean }>('/v1/payments/subscription/verify', data),
  
  getSubscriptionStatus: () =>
    api.get<SubscriptionStatus>('/v1/payments/subscription/status'),
  
  getPaymentHistory: (limit?: number, offset?: number) =>
    api.get<Payment[]>('/v1/payments/history', { params: { limit, offset } }),
  
  sendReminder: (invoice_id: string) =>
    api.post<{ status: string; invoice_id: string }>('/v1/send-reminder', null, { params: { invoice_id } }),
};

// Products API (NEW)
export const productsAPI = {
  getAll: (params?: {
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 1 | -1;
  }) =>
    api.get<ProductListResponse>('/v1/products', { params }),
  
  getById: (id: string) =>
    api.get<Product>(`/v1/products/${id}`),
  
  create: (data: ProductCreate) =>
    api.post<Product>('/v1/products', data),
  
  update: (id: string, data: ProductUpdate) =>
    api.put<Product>(`/v1/products/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/v1/products/${id}`),
  
  adjustQuantity: (id: string, data: ProductQuantityAdjustment) =>
    api.patch<Product>(`/v1/products/${id}/adjust-quantity`, data),
};

// Expenses API (NEW)
export const expensesAPI = {
  getAll: (params?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    period?: 'week' | 'month' | 'year';
    reference_date?: string;
    tags?: string[];
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 1 | -1;
  }) => {
    // Handle tags array - backend accepts repeated params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value)) {
          value.forEach(tag => queryParams.append('tags', tag));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return api.get<ExpenseListResponse>(`/v1/expenses?${queryParams.toString()}`);
  },
  
  getById: (id: string) =>
    api.get<Expense>(`/v1/expenses/${id}`),
  
  create: (data: ExpenseCreate) =>
    api.post<Expense>('/v1/expenses', data),
  
  update: (id: string, data: ExpenseUpdate) =>
    api.put<Expense>(`/v1/expenses/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/v1/expenses/${id}`),
  
  getCategories: () =>
    api.get<string[]>('/v1/expenses/categories'),
  
  getSummary: (params?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    period?: 'week' | 'month' | 'year';
    reference_date?: string;
  }) =>
    api.get<ExpenseSummaryResponse>('/v1/expenses/summary', { params }),
};

// Demo extraction helper - uses the same endpoint as authenticated extraction
export const demoExtract = async (text: string) => {
  const formData = new FormData();
  formData.append('text', text);
  // file field is not added, will be null on backend
  return extractionAPI.extractJobDetails(formData);
};
