import Constants from 'expo-constants';

const ENV = Constants.expoConfig?.extra?.eas?.environment || 'development';
const BASE_URL = ENV === 'production' 
  ? process.env.EXPO_PUBLIC_API_BASE_URL_PROD 
  : process.env.EXPO_PUBLIC_API_BASE_URL_DEV;

/**
 * Validate API URL for security
 */
export function validateApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // In production, enforce HTTPS
    if (ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }
    // Check for valid protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Validate base URL on startup
if (!BASE_URL || !validateApiUrl(BASE_URL)) {
  if (!__DEV__) {
    throw new Error('Invalid API URL configuration. HTTPS required in production.');
  }
  console.warn('⚠️ Invalid API URL configuration:', BASE_URL);
}

export const API_CONFIG = {
  BASE_URL: `${BASE_URL}/v1`,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'invoyq_auth_token',
  USER_PREFERENCES: 'invoyq_preferences',
  OFFLINE_QUEUE: 'invoyq_offline_queue',
};

export const CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
};

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#64748B' },
  { value: 'sent', label: 'Sent', color: '#6366F1' },
  { value: 'paid', label: 'Paid', color: '#10B981' },
  { value: 'overdue', label: 'Overdue', color: '#EF4444' },
  { value: 'cancelled', label: 'Cancelled', color: '#94A3B8' },
];

export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Transportation',
  'Utilities',
  'Marketing',
  'Equipment',
  'Salaries',
  'Rent',
  'Software',
  'Professional Services',
  'Other',
];
