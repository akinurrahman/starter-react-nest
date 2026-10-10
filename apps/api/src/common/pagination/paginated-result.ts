import type { PaginationMeta } from '@starter/shared';

export class PaginatedResult<T, S = undefined> {
  constructor(
    readonly items: T[],
    readonly pagination: PaginationMeta,
    readonly summary?: S,
  ) {}
}
