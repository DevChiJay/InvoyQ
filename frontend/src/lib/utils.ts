import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats API error detail into a user-friendly string message.
 * Handles FastAPI validation errors which return detail as an array of objects.
 */
export function formatErrorMessage(detail: unknown, fallback: string): string {
  // If detail is a string, return it
  if (typeof detail === 'string') {
    return detail;
  }
  
  // If detail is an array (FastAPI validation errors)
  if (Array.isArray(detail)) {
    // Extract messages from validation error objects
    const messages = detail
      .map((err: unknown) => {
        if (typeof err === 'string') return err;
        if (err && typeof err === 'object' && 'msg' in err) {
          return String(err.msg);
        }
        return null;
      })
      .filter(Boolean);
    
    return messages.length > 0 ? messages.join(', ') : fallback;
  }
  
  // If detail is an object with a message property
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as Record<string, unknown>).msg);
  }
  
  // Fallback to default message
  return fallback;
}

/**
 * Formats a date to YYYY-MM-DD format
 * Accepts both Date objects and ISO datetime/date strings
 * Returns empty string if invalid
 */
export function formatDateToYYYYMMDD(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    // Handle both ISO datetime and YYYY-MM-DD formats
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Parses a date string (ISO datetime or YYYY-MM-DD) to Date object
 * Returns null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Checks if a date string is valid
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  return parseDate(dateString) !== null;
}
