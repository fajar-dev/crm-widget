import { zValidator as honoZValidator } from '@hono/zod-validator';
import type { ZodSchema, ZodError } from 'zod';
import type { ValidationTargets } from 'hono';

/**
 * Formats ZodError into a structured error object.
 * Groups errors by field path.
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path]!.push(issue.message);
  }

  return errors;
}

/**
 * Generic Zod validation middleware for Hono.
 * Validates request data against a Zod schema and returns
 * structured error responses on failure.
 *
 * @param target - The part of the request to validate ('json', 'query', 'param')
 * @param schema - Zod schema to validate against
 *
 * Usage:
 * ```typescript
 * router.post('/', validate('json', createContactSchema), handler);
 * router.get('/', validate('query', paginationSchema), handler);
 * ```
 */
export function validate<T extends keyof ValidationTargets>(target: T, schema: ZodSchema) {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          statusCode: 422,
          message: 'Validation failed',
          data: null,
          errors: formatZodErrors(result.error),
        },
        422,
      );
    }
  });
}
