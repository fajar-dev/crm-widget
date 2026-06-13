import type { Context } from 'hono';
import { BaseException } from '../exceptions/base.ts';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns structured API error responses.
 */
export function errorHandler(err: Error, c: Context) {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);

  if (err instanceof BaseException) {
    return c.json(
      {
        success: false,
        statusCode: err.statusCode,
        message: err.message,
        data: null,
        ...(err.errors && { errors: err.errors }),
      },
      err.statusCode as any,
    );
  }

  // Unknown errors — don't leak internal details in production
  const isDev = process.env.NODE_ENV !== 'production';
  return c.json(
    {
      success: false,
      statusCode: 500,
      message: isDev ? err.message : 'Internal Server Error',
      data: null,
      ...(isDev && { stack: err.stack }),
    },
    500,
  );
}
