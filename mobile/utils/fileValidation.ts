// File validation utilities for secure file uploads

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileInfo {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

/**
 * Validate image file for upload
 */
export function validateImageFile(file: FileInfo): FileValidationResult {
  // Check file type
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size && file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  // Check filename extension if type is not available
  if (!file.type && file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension. Use JPG, PNG, or WebP.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate document file for upload
 */
export function validateDocumentFile(file: FileInfo): FileValidationResult {
  // Check file type
  if (file.type && !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PDF, JPG, PNG`,
    };
  }

  // Check file size
  if (file.size && file.size > MAX_DOCUMENT_SIZE) {
    const maxSizeMB = MAX_DOCUMENT_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  // Check filename extension if type is not available
  if (!file.type && file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    
    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension. Use PDF, JPG, or PNG.',
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Check if file is an image based on extension
 */
export function isImageFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension);
}

/**
 * Check if file is a document based on extension
 */
export function isDocumentFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension);
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file before upload (comprehensive check)
 */
export function validateFile(
  file: FileInfo,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    category?: 'image' | 'document' | 'any';
  } = {}
): FileValidationResult {
  const {
    allowedTypes,
    maxSize = MAX_IMAGE_SIZE,
    category = 'any',
  } = options;

  // Category-specific validation
  if (category === 'image') {
    return validateImageFile(file);
  } else if (category === 'document') {
    return validateDocumentFile(file);
  }

  // Custom allowed types
  if (allowedTypes && file.type && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Size check
  if (file.size && file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum: ${formatFileSize(maxSize)}`,
    };
  }

  // Basic security checks
  if (file.name) {
    const sanitized = sanitizeFilename(file.name);
    if (sanitized !== file.name) {
      return {
        valid: false,
        error: 'Invalid characters in filename',
      };
    }
  }

  return { valid: true };
}
