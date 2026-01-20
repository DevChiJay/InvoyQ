import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: string | number, currency: string = 'NGN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0.00';
  
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency + ' ';
  
  return `${symbol}${num.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string, formatStr: string = 'MMM dd, yyyy'): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays === -1) return 'Tomorrow';
    if (diffInDays < 7 && diffInDays > 0) return `${diffInDays} days ago`;
    if (diffInDays > -7 && diffInDays < 0) return `In ${Math.abs(diffInDays)} days`;
    if (diffInDays < 30 && diffInDays > 0) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    paid: '#10B981',
    sent: '#3B82F6',
    draft: '#F59E0B',
    overdue: '#EF4444',
    cancelled: '#6B7280',
    active: '#10B981',
    inactive: '#6B7280',
  };
  return statusColors[status.toLowerCase()] || '#6B7280';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
