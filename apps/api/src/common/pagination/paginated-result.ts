import type { Pagination } from './pagination-meta.js';

export class PaginatedResult<T, S = undefined> {
  constructor(
    readonly items: T[],
    readonly pagination: Pagination,
    readonly summary?: S,
  ) {}
}
