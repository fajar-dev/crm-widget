import type { Hook } from '@hono/zod-openapi';
import type { ZodError } from 'zod';

/**
 * Custom validation hook for @hono/zod-openapi.
 * Transforms Zod validation errors into structured API error responses.
 */
export const validationHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    const errors = formatZodErrors(result.error);
    return c.json(
      {
        success: false,
        statusCode: 422,
        message: 'Validation failed',
        data: null,
        errors,
      },
      422,
    );
  }
};

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
    errors[path].push(issue.message);
  }

  return errors;
}
