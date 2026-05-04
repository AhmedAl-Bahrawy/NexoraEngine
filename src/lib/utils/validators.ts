/**
 * Validation Utilities
 * Input validation helpers for Supabase operations
 */

import { STORAGE, DATABASE } from '../constants/supabase'

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  let score = 0
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else {
    score++
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score++
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score++
  }
  
  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score++
  }
  
  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score++
  }
  
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

// UUID validation
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// File validation
export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export function validateFile(
  file: File,
  options?: {
    maxSize?: number
    allowedTypes?: readonly string[]
    allowedExtensions?: readonly string[]
  }
): FileValidationResult {
  // Check file exists
  if (!file || file.size === 0) {
    return { isValid: false, error: 'No file provided' }
  }
  
  // Check file size
  const maxSize = options?.maxSize || STORAGE.MAX_FILE_SIZE
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit`,
    }
  }
  
  // Check mime type
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }
  }
  
  // Check file extension
  if (options?.allowedExtensions && options.allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !options.allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension .${extension} is not allowed`,
      }
    }
  }
  
  return { isValid: true }
}

export function validateImage(file: File): FileValidationResult {
  return validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB for images
    allowedTypes: STORAGE.ALLOWED_IMAGE_TYPES,
  })
}

export function validateDocument(file: File): FileValidationResult {
  return validateFile(file, {
    maxSize: 10 * 1024 * 1024, // 10MB for documents
    allowedTypes: STORAGE.ALLOWED_DOCUMENT_TYPES,
  })
}

// URL validation
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Phone number validation (basic international format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Pagination validation
export function validatePagination(
  page: number,
  pageSize: number
): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Math.floor(page)),
    pageSize: Math.min(
      DATABASE.MAX_PAGE_SIZE,
      Math.max(1, Math.floor(pageSize))
    ),
  }
}

// Sort validation
export function validateSortColumn(
  column: string,
  allowedColumns: readonly string[]
): string {
  return allowedColumns.includes(column) 
    ? column 
    : allowedColumns[0] || 'created_at'
}

// String sanitization
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

// Object validation - check if object has all required fields
export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missing: (keyof T)[] } {
  const missing = requiredFields.filter(field => {
    const value = obj[field]
    return value === undefined || value === null || value === ''
  })
  
  return {
    isValid: missing.length === 0,
    missing,
  }
}

// Number validation
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

// Date validation
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now()
}

export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now()
}

// Array validation
export function isNonEmptyArray<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}

export function hasUniqueValues<T>(arr: T[]): boolean {
  return new Set(arr).size === arr.length
}

// Helpers
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
