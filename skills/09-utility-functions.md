# Skill: Utility Functions

## id
`nexora.utility-functions`

## name
Utility Functions

## category
utilities

## description
Common utility functions for validation, formatting, and rate limiting to support application development.

## intent
### what
Provides helper functions for input validation, data formatting, and rate limiting that complement the core SDK functionality.

### why
Reduces boilerplate code and provides standardized utilities that work seamlessly with the SDK's validation and error handling systems.

## functions

### Validators (`src/lib/utils/validators.ts`)

#### `isValidEmail(email: string): boolean`
Validates if a string is a valid email format.

```typescript
import { isValidEmail } from 'nexora-engine'

if (isValidEmail('user@example.com')) {
  // Valid email
}
```

#### `validatePassword(password: string): { isValid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' }`
Validates password strength with detailed feedback.

```typescript
import { validatePassword } from 'nexora-engine'

const result = validatePassword('MyP@ssw0rd')
// { isValid: true, errors: [], strength: 'strong' }
```

#### `validateFileType(file: File, allowedTypes: string[]): boolean`
Validates if a file's MIME type is in the allowed list.

```typescript
import { validateFileType } from 'nexora-engine'

const valid = validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])
```

#### `validateFileSize(file: File, maxSizeBytes: number): boolean`
Validates if a file is within the size limit.

```typescript
import { validateFileSize } from 'nexora-engine'

const valid = validateFileSize(file, 5 * 1024 * 1024) // 5MB limit
```

### Formatters (`src/lib/utils/formatters.ts`)

#### `formatDate(date: string | Date, format?: 'short' | 'long' | 'relative'): string`
Formats dates for display.

```typescript
import { formatDate } from 'nexora-engine'

formatDate('2024-01-15') // "Jan 15, 2024"
formatDate(new Date(), 'long') // "Monday, January 15, 2024"
formatDate(new Date(Date.now() - 3600000), 'relative') // "1 hour ago"
```

#### `formatDateTime(date: string | Date): string`
Formats date and time.

```typescript
import { formatDateTime } from 'nexora-engine'

formatDateTime('2024-01-15T10:30:00') // "Jan 15, 2024, 10:30 AM"
```

#### `formatFileSize(bytes: number): string`
Formats file sizes in human-readable format.

```typescript
import { formatFileSize } from 'nexora-engine'

formatFileSize(1536) // "1.5 KB"
formatFileSize(2097152) // "2 MB"
```

#### `truncateText(text: string, maxLength: number): string`
Truncates text with ellipsis.

```typescript
import { truncateText } from 'nexora-engine'

truncateText('Long text here...', 10) // "Long text..."
```

#### `slugify(text: string): string`
Converts text to URL-friendly slug.

```typescript
import { slugify } from 'nexora-engine'

slugify('Hello World!') // "hello-world"
```

### Rate Limiting (`src/lib/utils/rate-limit.ts`)

#### `RateLimiter` class
Rate limiter for controlling request rates.

```typescript
import { RateLimiter } from 'nexora-engine'

const limiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,     // Max 100 requests per minute
  message: 'Too many requests'
})

// Check if request is allowed
try {
  const { allowed, remaining, resetAt } = await limiter.check('user-123')
  if (allowed) {
    // Proceed with request
  }
} catch (error) {
  // Rate limit exceeded
}
```

#### `rateLimit(identifier: string, config?: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: number }>`
Simple rate limit function.

```typescript
import { rateLimit } from 'nexora-engine'

const result = await rateLimit('user-123', {
  windowMs: 60 * 1000,
  maxRequests: 100
})

if (result.allowed) {
  // Proceed
}
```

## usage

### Input Validation Example
```typescript
import { validatePassword, validateFileType, validateFileSize } from 'nexora-engine'

function handleUserInput(email: string, password: string, avatar: File) {
  // Validate email
  if (!isValidEmail(email)) {
    throw new Error('Invalid email')
  }
  
  // Validate password
  const pwdCheck = validatePassword(password)
  if (!pwdCheck.isValid) {
    throw new Error(`Password issues: ${pwdCheck.errors.join(', ')}`)
  }
  
  // Validate avatar
  if (!validateFileType(avatar, ['image/jpeg', 'image/png'])) {
    throw new Error('Invalid file type')
  }
  
  if (!validateFileSize(avatar, 5 * 1024 * 1024)) {
    throw new Error('File too large (max 5MB)')
  }
  
  // Proceed with valid data
}
```

### Data Formatting Example
```typescript
import { formatDate, formatFileSize, truncateText } from 'nexora-engine'

function displayUser(user: User, file: File) {
  return {
    name: truncateText(user.name, 20),
    joined: formatDate(user.created_at, 'long'),
    avatarSize: formatFileSize(file.size),
    lastSeen: formatDate(user.last_seen, 'relative')
  }
}
```

### Rate Limiting Example
```typescript
import { RateLimiter } from 'nexora-engine'

const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100
})

async function handleAPIRequest(req, res) {
  try {
    const { allowed, remaining } = await apiLimiter.check(req.ip)
    
    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' })
    }
    
    res.setHeader('X-RateLimit-Remaining', remaining)
    // Process request...
  } catch (error) {
    // Rate limit exceeded
  }
}
```

## integration

These utilities integrate with other SDK layers:

- **Validators** work with `ValidationError` and Zod schemas
- **Formatters** work with data from database queries
- **Rate limiting** can protect routes using `enforceAuth` middleware

## constraints
- Validators are synchronous (except file validation which may be async in future)
- Formatters don't modify original data
- Rate limiter is in-memory (use Redis for distributed systems)

## metadata
- complexity: low
- stability: stable
- sdk_layer: utilities
