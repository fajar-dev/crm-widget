import type { Context } from 'hono';

/** Pagination meta information */
export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
}

/** Standard API response structure */
export interface ApiResponseBody<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Utility class for building consistent API responses.
 * All endpoints MUST use these methods for response formatting.
 */
export class ApiResponse {
  /**
   * Success response for single item or non-paginated data.
   */
  static success<T>(c: Context, data: T, message = 'Success', statusCode = 200) {
    return c.json<ApiResponseBody<T>>(
      {
        success: true,
        statusCode,
        message,
        data,
      },
      statusCode as any,
    );
  }

  /**
   * Success response for created resource.
   */
  static created<T>(c: Context, data: T, message = 'Created successfully') {
    return ApiResponse.success(c, data, message, 201);
  }

  /**
   * Success response with pagination meta.
   */
  static paginated<T>(
    c: Context,
    data: T[],
    total: number,
    page: number,
    perPage: number,
    message = 'Success',
  ) {
    const lastPage = Math.ceil(total / perPage) || 1;
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, total);

    return c.json<ApiResponseBody<T[]>>(
      {
        success: true,
        statusCode: 200,
        message,
        data,
        meta: {
          total,
          perPage,
          currentPage: page,
          lastPage,
          from,
          to,
        },
      },
      200,
    );
  }

  /**
   * Error response.
   */
  static error(
    c: Context,
    message: string,
    statusCode = 400,
    errors?: Record<string, string[]>,
  ) {
    return c.json<ApiResponseBody<null> & { errors?: Record<string, string[]> }>(
      {
        success: false,
        statusCode,
        message,
        data: null,
        ...(errors && { errors }),
      },
      statusCode as any,
    );
  }
}
