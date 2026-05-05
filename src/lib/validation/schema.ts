import { z, ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../errors/nexora-error'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError }

export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: { field?: string; operation?: string }
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.') || 'root'
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      }

      throw new ValidationError(
        `Validation failed${context?.operation ? ` during ${context.operation}` : ''}`,
        {
          details: {
            issues: error.issues,
            context,
          },
          fieldErrors,
        }
      )
    }
    throw ValidationError.from(error)
  }
}

export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.') || 'root'
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      }

      return {
        success: false,
        error: new ValidationError('Validation failed', {
          details: { issues: error.issues },
          fieldErrors,
        }),
      }
    }

    return {
      success: false,
      error: ValidationError.from(error),
    }
  }
}

export function createValidator<T>(schema: ZodSchema<T>) {
  return {
    validate: (data: unknown, context?: { field?: string; operation?: string }) =>
      validate(schema, data, context),
    safeValidate: (data: unknown) => safeValidate(schema, data),
    schema,
  }
}

export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  uuid: z.string().uuid('Invalid UUID format'),
  url: z.string().url('Invalid URL format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number'),
  nonEmptyString: z.string().min(1, 'This field cannot be empty'),
  positiveNumber: z.number().positive('Must be a positive number'),
  pagination: z.object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(1000).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  filter: z.object({
    column: z.string().min(1),
    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'is']),
    value: z.unknown(),
  }),
}

export type CommonSchemas = typeof commonSchemas
