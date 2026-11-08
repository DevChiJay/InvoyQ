import { format, formatDistanceToNow } from 'date-fns';
import { DEFAULT_CURRENCY, getCurrency } from './currency';

/**
 * Safely formats a date string to a relative time (e.g., "2 days ago")
 * Returns "N/A" if the date is invalid or missing
 */
export const formatRelativeDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'N/A';
  }
};

/**
 * Safely formats a date string to a localized date string
 * Returns "N/A" if the date is invalid or missing
 */
export const formatSimpleDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

/**
 * Safely formats a date string to ISO format (YYYY-MM-DD)
 * Returns empty string if the date is invalid or missing
 */
export const formatISODate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Formats a currency value (accepts string or number)
 * Handles decimal strings from backend
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string => {
  const numericAmount = parseDecimal(amount);
  const code = currency || DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat(getCurrency(code)?.locale ?? 'en-NG', {
      style: 'currency',
      currency: code,
    }).format(numericAmount);
  } catch {
    // Unknown currency code from older data: show the code rather than throwing.
    return `${code} ${numericAmount.toFixed(2)}`;
  }
};

/**
 * Safely parses a decimal string to number for calculations
 * Returns 0 if invalid
 */
/** Short money for chart axes: ₦1.2M, ₦350K, ₦900. Tooltips and cards use formatCurrency. */
export function formatCompactCurrency(
  amount: string | number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  const value = parseDecimal(amount);
  try {
    return new Intl.NumberFormat(getCurrency(currency)?.locale ?? 'en-NG', {
      style: 'currency',
      currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

export const parseDecimal = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a number/string as a decimal string (for display)
 */
export const formatDecimal = (value: number | string | null | undefined, decimals: number = 2): string => {
  const num = parseDecimal(value);
  return num.toFixed(decimals);
};

/** Badge variant for an invoice or payment status. One mapping for the whole app. */
export type StatusVariant = 'success' | 'info' | 'warning' | 'destructive' | 'muted' | 'outline';

export const getStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'sent':
      return 'info';
    case 'pending':
      return 'warning';
    case 'overdue':
    case 'failed':
      return 'destructive';
    case 'draft':
      return 'muted';
    default:
      return 'outline';
  }
};

/** Single short date format for tables and details, e.g. "15 Jun 2026". */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '—' : format(date, 'd MMM yyyy');
};

/**
 * Get display text for invoice status
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/** Display name for an invoice's client; the API populates `client` from `client_id`. */
export const invoiceClientName = (invoice: { client?: { name?: string } | null }): string =>
  invoice.client?.name || 'Unknown client';
