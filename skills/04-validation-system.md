# Skill: Validation System

## id
`nexora.validation-system`

## name
Validation System

## category
validation

## description
Zod-based schema validation layer with input sanitization, fail-fast design, and detailed field-level error reporting.

## intent
### what
Provides a validation layer using Zod schemas for runtime type checking, input sanitization, and schema-based validation of API inputs and database operations.

### why
Ensures data integrity, catches errors early (fail-fast), and provides consistent validation patterns across the SDK without reinventing validation logic.

## inputs
```typescript
// validate()
schema: ZodSchema<T>
data: unknown
context?: { field?: string; operation?: string }

// safeValidate()
schema: ZodSchema<T>
data: unknown

// commonSchemas
{
  email: ZodSchema
  password: ZodSchema
  uuid: ZodSchema
  url: ZodSchema
  phone: ZodSchema
  nonEmptyString: ZodSchema
  positiveNumber: ZodSchema
  pagination: ZodSchema
  filter: ZodSchema
}
```

## outputs
```typescript
// validate() - throws on failure
T (validated data)

// safeValidate()
{
  success: true; data: T
} | {
  success: false; error: ValidationError
}

// ValidationError
{
  message: string
  code: 'validation_error'
  statusCode: 422
  fieldErrors?: Record<string, string[]>
}
```

## usage
### steps
1. Import `validate`, `safeValidate`, or `commonSchemas` from `nexora-engine`
2. Define or use existing Zod schema
3. Call `validate()` (throws) or `safeValidate()` (returns result)
4. Handle validation errors appropriately

### code examples
```typescript
import { validate, commonSchemas, ValidationError } from 'nexora-engine'
import { z } from 'zod'

// Using common schemas
const email = validate(commonSchemas.email, 'user@example.com')

// Custom schema with validate() (throws on failure)
const userSchema = z.object({
  name: z.string().min(2),
  email: commonSchemas.email,
  age: z.number().min(18).optional(),
})

try {
  const validated = validate(userSchema, {
    name: 'John',
    email: 'john@example.com',
    age: 25,
  })
  // Use validated data
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.fieldErrors)
  }
}

// Using safeValidate() (returns result)
const result = safeValidate(userSchema, inputData)
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}

// Creating reusable validators
const userValidator = createValidator(userSchema)
const data = userValidator.validate(input)
const safeResult = userValidator.safeValidate(input)
```

## logic
### internal flow
1. `validate()`: Call `schema.parse(data)`, catch `ZodError`, transform to `ValidationError`
2. `safeValidate()`: Call `schema.parse(data)`, return success/failure result
3. `ValidationError`: Contains `fieldErrors` map with path → messages

### execution reasoning
- Uses Zod v4 for schema definition and validation
- `validate()` is for "throw on error" pattern
- `safeValidate()` is for "result object" pattern
- `commonSchemas` provides pre-built schemas for common validations

## constraints
### rules
- Schemas must be Zod schemas (v4)
- `validate()` throws `ValidationError` on failure
- `safeValidate()` never throws
- `fieldErrors` uses dot notation for nested paths

### anti-patterns
- Don't use `any` type - define proper schemas
- Don't validate twice (schema.parse + manual checks)
- Don't ignore `fieldErrors` in UI forms

## dependencies
### internal SDK modules
- `ValidationError` (from `./errors/nexora-error`)
- `createValidator` (from `./validation/schema`)

### external libraries
- `zod` (v4+)

## code_mapping
```typescript
// SDK Functions
validate()         -> validate()
safeValidate()     -> safeValidate()
createValidator()  -> createValidator()
commonSchemas     -> commonSchemas object
ValidationError   -> ValidationError class
```

## ai_instructions
### when to use
- Use before database insert/update operations
- Use for API request validation
- Use for user input sanitization
- Use `commonSchemas` for standard fields (email, password, etc.)

### when NOT to use
- Don't use for Supabase auth (handled internally)
- Don't use for file validation (use storage validators)
- Don't use as a type system replacement (use TypeScript for static types)

### reasoning strategy
1. Identify data to validate
2. Choose `validate()` (throw) vs `safeValidate()` (result)
3. Use `commonSchemas` for standard fields
4. Create custom schemas with Zod for complex objects
5. Handle `ValidationError.fieldErrors` in UI

## metadata
- complexity: low
- stability: stable
- sdk_layer: validation
