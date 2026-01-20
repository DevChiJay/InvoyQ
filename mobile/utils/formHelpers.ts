import { ZodSchema, ZodError } from 'zod';

/**
 * Validate form data against a Zod schema
 * Returns an object with field names as keys and error messages as values
 */
export function validateForm<T>(
  schema: ZodSchema<T>,
  data: unknown
): Record<string, string> {
  try {
    schema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return errors;
    }
    return {};
  }
}

/**
 * Check if errors object has any errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Sanitize form data by removing empty strings and trimming values
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];

    // Trim strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Convert empty strings to undefined
      sanitized[key] = trimmed === '' ? undefined : trimmed;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeFormData(value);
    }
  });

  return sanitized;
}

/**
 * Format form data for API submission
 * Removes undefined values and applies transformations
 */
export function formatFormData<T extends Record<string, any>>(
  data: T
): Partial<T> {
  const formatted: any = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    // Skip undefined values
    if (value === undefined) return;

    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      formatted[key] = value.toISOString();
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      formatted[key] = value;
    }
    // Recursively format nested objects
    else if (value && typeof value === 'object') {
      formatted[key] = formatFormData(value);
    }
    // Keep other values as-is
    else {
      formatted[key] = value;
    }
  });

  return formatted;
}

/**
 * Get error message for a specific field from errors object
 */
export function getFieldError(
  errors: Record<string, string>,
  fieldName: string
): string | undefined {
  return errors[fieldName];
}

/**
 * Clear specific field errors
 */
export function clearFieldErrors(
  errors: Record<string, string>,
  ...fields: string[]
): Record<string, string> {
  const newErrors = { ...errors };
  fields.forEach((field) => {
    delete newErrors[field];
  });
  return newErrors;
}
