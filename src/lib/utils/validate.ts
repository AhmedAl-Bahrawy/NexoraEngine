import { z, ZodSchema, ZodError } from 'zod'
import { ValidationError } from './errors'

export { z, ZodSchema, ZodError }

export type AnyZodSchema = ZodSchema

export interface ValidationResult {
  valid: boolean
  errors: string[]
  data?: unknown
}

function flattenZodErrors(error: ZodError): string[] {
  return error.issues.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}

export function validateInput<T extends AnyZodSchema>(
  data: unknown,
  schema: T
): ValidationResult {
  const result = schema.safeParse(data)
  if (result.success) {
    return { valid: true, errors: [], data: result.data }
  }
  return { valid: false, errors: flattenZodErrors(result.error) }
}

export function validateOrFail<T extends AnyZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  const errors = flattenZodErrors(result.error)
  const fieldErrors = result.error.issues.reduce<Record<string, string[]>>((acc: Record<string, string[]>, err) => {
    const key = err.path.join('.') || 'root'
    if (!acc[key]) acc[key] = []
    acc[key].push(err.message)
    return acc
  }, {})
  throw new ValidationError(errors.join(', '), fieldErrors)
}

export function createValidator<T extends AnyZodSchema>(schema: T) {
  return {
    parse: (data: unknown): z.infer<T> => schema.parse(data),
    safeParse: (data: unknown) => schema.safeParse(data),
    validate: (data: unknown): ValidationResult => validateInput(data, schema),
    validateOrFail: (data: unknown): z.infer<T> => validateOrFail(data, schema),
  }
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const schema = z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')

  const result = schema.safeParse(password)
  if (result.success) {
    return { isValid: true, errors: [] }
  }
  return { isValid: false, errors: flattenZodErrors(result.error) }
}

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}
