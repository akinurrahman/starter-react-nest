import type { PaginationMeta } from './pagination.js';

// Success bodies as the api's ResponseInterceptor sends them.

export type ApiResponse<T> = { data: T };

export type PaginatedResponse<T, S = undefined> = {
  data: T[];
  pagination: PaginationMeta;
  summary?: S;
};
