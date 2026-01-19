import { formatDistanceToNow } from 'date-fns';

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
export const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(0);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numericAmount);
};

/**
 * Safely parses a decimal string to number for calculations
 * Returns 0 if invalid
 */
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

/**
 * Get badge variant for invoice status
 */
export const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'paid':
      return 'default'; // Green
    case 'sent':
      return 'secondary'; // Blue
    case 'overdue':
      return 'destructive'; // Red
    case 'draft':
      return 'outline'; // Gray
    default:
      return 'outline';
  }
};

/**
 * Get display text for invoice status
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
