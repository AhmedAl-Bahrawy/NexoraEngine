# Skill 06: Utility Functions

## Template Core Files
- `src/lib/utils/errors.ts` - Error handling
- `src/lib/utils/validators.ts` - Input validation
- `src/lib/utils/formatters.ts` - Data formatting
- `src/lib/utils/index.ts` - Barrel exports

## Error Handling (`errors.ts`)

### Custom Error Classes
All extend `SupabaseError` which includes: `name`, `message`, `code`, `details?`, `hint?`, `statusCode?`

| Class | Use Case |
|-------|----------|
| `SupabaseError` | Base error for all Supabase operations |
| `AuthError` | Authentication failures (login, signup, OAuth) |
| `DatabaseError` | Database operation failures (query, mutation) |
| `StorageError` | File operation failures (upload, download, delete) |
| `ValidationError` | Input validation failures with field-level errors |

### Core Functions
| Function | Purpose | Returns |
|----------|---------|---------|
| `handleSupabaseError(error)` | Universal error handler - detects type and returns appropriate SupabaseError subclass | `SupabaseError` |
| `logError(error, context?)` | Logs error with context, name, code, timestamp | `void` |
| `getErrorSuggestion(error)` | Returns user-friendly suggestion based on error code | `string` |
| `formatErrorForDisplay(error)` | Formats error for UI display | `{ title, message, suggestion, code }` |
| `isAuthErrorType(error)` | Type guard for AuthError | `boolean` |
| `isDatabaseErrorType(error)` | Type guard for DatabaseError | `boolean` |
| `isStorageErrorType(error)` | Type guard for StorageError | `boolean` |
| `isValidationErrorType(error)` | Type guard for ValidationError | `boolean` |

### Error Type Detection
`handleSupabaseError()` uses type guards to detect error sources:
- `isPostgrestError` → `{ message, code, details, hint }` → `DatabaseError`
- `isAuthError` → `{ message, status }` → `AuthError`
- `isStorageError` → `{ message, statusCode }` → `StorageError`

## Validators (`validators.ts`)

| Function | Purpose | Returns |
|----------|---------|---------|
| `isValidEmail(email)` | Email format check (regex) | `boolean` |
| `validatePassword(password)` | Password strength (length, uppercase, lowercase, number, special char) | `{ isValid, errors[], strength: 'weak' \| 'medium' \| 'strong' }` |
| `isValidUUID(uuid)` | UUID format check | `boolean` |
| `validateFile(file, options?)` | File validation with size, type, extension checks | `{ isValid, error? }` |
| `validateImage(file)` | Image validation (max 5MB, image mime types) | `{ isValid, error? }` |
| `validateDocument(file)` | Document validation (max 10MB, doc/pdf/txt) | `{ isValid, error? }` |
| `isValidURL(url)` | URL parseability check | `boolean` |
| `isValidPhone(phone)` | International phone format | `boolean` |
| `validatePagination(page, pageSize)` | Sanitizes pagination params (min 1, max 100) | `{ page, pageSize }` |
| `validateSortColumn(column, allowedColumns)` | Ensures column is in allowed list | `string` |
| `sanitizeString(input)` | Trims whitespace, removes < > characters | `string` |
| `hasRequiredFields(obj, requiredFields)` | Checks all required fields exist and are non-empty | `{ isValid, missing[] }` |
| `isPositiveNumber(value)` | Type guard for positive numbers | `boolean` |
| `isNonNegativeNumber(value)` | Type guard for non-negative numbers | `boolean` |
| `isValidDate(value)` | Type guard for valid Date objects | `boolean` |
| `isFutureDate(date)` | Checks date is in the future | `boolean` |
| `isPastDate(date)` | Checks date is in the past | `boolean` |
| `isNonEmptyArray(arr)` | Type guard for non-empty arrays | `boolean` |
| `hasUniqueValues(arr)` | Checks all values are unique | `boolean` |

## Formatters (`formatters.ts`)

### Date/Time
| Function | Purpose | Example |
|----------|---------|---------|
| `formatDate(date, format?)` | Short/long/relative date formatting | `"Jan 15, 2026"` or `"2 days ago"` |
| `formatDateTime(date)` | Date + time formatting | `"Jan 15, 2026, 3:30 PM"` |
| `formatTime(date)` | Time only | `"3:30 PM"` |

### Numbers
| Function | Purpose | Example |
|----------|---------|---------|
| `formatNumber(num, decimals?)` | Locale-formatted number | `"1,234,567"` |
| `formatCurrency(amount, currency?)` | Currency formatting | `"$1,234.56"` |
| `formatPercent(value, decimals?)` | Percentage formatting | `"75.0%"` |
| `formatFileSize(bytes)` | Human-readable file size | `"2.5 MB"` |
| `formatCount(count, singular, plural?)` | Count with label | `"5 records"` |

### Strings
| Function | Purpose | Example |
|----------|---------|---------|
| `truncate(str, length, suffix?)` | Truncate with ellipsis | `"Hello..."` |
| `capitalize(str)` | Capitalize first letter | `"Hello"` |
| `toTitleCase(str)` | Title case | `"Hello World"` |
| `toSlug(str)` | URL-safe slug | `"hello-world"` |
| `toCamelCase(str)` | camelCase conversion | `"helloWorld"` |
| `toSnakeCase(str)` | snake_case conversion | `"hello_world"` |

### Data
| Function | Purpose | Example |
|----------|---------|---------|
| `truncateUUID(uuid, parts?)` | Shorten UUID for display | `"abc123...f789"` |
| `maskEmail(email)` | Mask email for privacy | `"j***n@example.com"` |
| `formatPhone(phone)` | Format phone number | `"(123) 456-7890"` |
| `safeJSONStringify(obj, space?)` | JSON stringify with error handling | `"{}"` |
| `safeJSONParse(str, fallback?)` | JSON parse with fallback | `{}` |
| `formatList(items, conjunction?)` | Join list with conjunction | `"A, B, and C"` |
| `groupBy(items, key)` | Group array by property | `{ group1: [...], group2: [...] }` |

### URLs/Colors/Status
| Function | Purpose | Example |
|----------|---------|---------|
| `hexToRgba(hex, alpha?)` | Hex to RGBA conversion | `"rgba(255, 0, 0, 0.5)"` |
| `formatStatus(status)` | Humanize status strings | `"Pending Review"` |
| `buildQueryString(params)` | Build URL query string | `"?page=1&sort=desc"` |
| `extractFileNameFromURL(url)` | Get filename from URL | `"avatar.png"` |
| `formatColumnName(column)` | Humanize DB column names | `"Created At"` |
| `formatRecordCount(count)` | Format record count | `"5 records"` |
