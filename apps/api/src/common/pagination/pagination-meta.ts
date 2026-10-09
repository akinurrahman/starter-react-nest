import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasPrevious: z.boolean(),
  hasNext: z.boolean(),
});

export type Pagination = z.infer<typeof paginationMetaSchema>;
