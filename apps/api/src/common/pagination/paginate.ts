import { PaginatedResult } from './paginated-result.js';
import type { PaginationQuery } from './pagination-query.js';

// The only place pagination math happens. A page past the last one is not an
// error: it returns the (empty) items with the real totals.
export function paginate<T, S = undefined>(
  items: T[],
  total: number,
  query: PaginationQuery,
  summary?: S,
): PaginatedResult<T, S> {
  const { page, limit } = query;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return new PaginatedResult(
    items,
    {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1 && totalPages > 0,
      hasNext: page < totalPages,
    },
    summary,
  );
}
