import { z } from 'zod';

/**
 * Reusable pagination query parameter schema.
 * Used by all list/index endpoints.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
