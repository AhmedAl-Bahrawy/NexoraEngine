/**
 * Utils Barrel Export
 * Central export for all utility functions
 */

// Errors
export {
  SupabaseError,
  AuthError,
  DatabaseError,
  StorageError,
  ValidationError,
  handleSupabaseError,
  logError,
  isAuthErrorType,
  isDatabaseErrorType,
  isStorageErrorType,
  isValidationErrorType,
  getErrorSuggestion,
  formatErrorForDisplay,
} from './errors'

// Validators
export {
  isValidEmail,
  validatePassword,
  isValidUUID,
  validateFile,
  validateImage,
  validateDocument,
  isValidURL,
  isValidPhone,
  validatePagination,
  validateSortColumn,
  sanitizeString,
  hasRequiredFields,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  isFutureDate,
  isPastDate,
  isNonEmptyArray,
  hasUniqueValues,
  type FileValidationResult,
} from './validators'

// Formatters
export {
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatFileSize,
  formatCount,
  truncate,
  capitalize,
  toTitleCase,
  toSlug,
  toCamelCase,
  toSnakeCase,
  truncateUUID,
  maskEmail,
  formatPhone,
  safeJSONStringify,
  safeJSONParse,
  formatList,
  groupBy,
  hexToRgba,
  formatStatus,
  buildQueryString,
  extractFileNameFromURL,
  formatColumnName,
  formatRecordCount,
} from './formatters'
