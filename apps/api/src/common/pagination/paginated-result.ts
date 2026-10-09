export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export class PaginatedResult<T, S = undefined> {
  constructor(
    readonly items: T[],
    readonly pagination: Pagination,
    readonly summary?: S,
  ) {}
}
