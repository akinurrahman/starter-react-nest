import type { PaginatedResponse } from '@starter/shared';
import type { AsyncOptionsPage, Option } from '../types';

export function fromPaginated<T, S>(
  response: PaginatedResponse<T, S>,
  toOption: (item: T) => Option,
): AsyncOptionsPage {
  return {
    options: response.data.map(toOption),
    hasMore: response.pagination.hasNext,
  };
}
