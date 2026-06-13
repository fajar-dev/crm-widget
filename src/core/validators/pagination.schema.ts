import { z } from 'zod';

/**
 * Reusable pagination query parameter schema.
 * Used by all list/index endpoints.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    description: 'Page number',
    example: 1,
  }),
  perPage: z.coerce.number().int().min(1).max(100).default(10).openapi({
    description: 'Items per page (max 100)',
    example: 10,
  }),
  sortBy: z.string().optional().default('createdAt').openapi({
    description: 'Field to sort by',
    example: 'createdAt',
  }),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC').openapi({
    description: 'Sort direction',
    example: 'DESC',
  }),
  search: z.string().optional().openapi({
    description: 'Search query string',
    example: '',
  }),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
