import { paginate } from './paginate.js';
import { PaginatedResult } from './paginated-result.js';

describe('paginate', () => {
  it('returns a PaginatedResult holding the items', () => {
    const result = paginate([1, 2], 2, { page: 1, limit: 20 });

    expect(result).toBeInstanceOf(PaginatedResult);
    expect(result.items).toEqual([1, 2]);
  });

  it('computes a middle page', () => {
    expect(paginate([], 57, { page: 2, limit: 20 }).pagination).toEqual({
      page: 2,
      limit: 20,
      total: 57,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
    });
  });

  it('computes the first page', () => {
    expect(paginate([], 57, { page: 1, limit: 20 }).pagination).toMatchObject({
      totalPages: 3,
      hasPrevious: false,
      hasNext: true,
    });
  });

  it('computes the last page', () => {
    expect(paginate([], 57, { page: 3, limit: 20 }).pagination).toMatchObject({
      totalPages: 3,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it('rounds totalPages up on an exact multiple', () => {
    expect(paginate([], 40, { page: 1, limit: 20 }).pagination.totalPages).toBe(
      2,
    );
  });

  it('returns 0 totalPages and no flags for zero results', () => {
    expect(paginate([], 0, { page: 1, limit: 20 }).pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it('keeps hasPrevious false for zero results past page 1', () => {
    expect(paginate([], 0, { page: 3, limit: 20 }).pagination).toMatchObject({
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it('keeps the real totals beyond the last page', () => {
    const result = paginate([], 57, { page: 5, limit: 20 });

    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      page: 5,
      limit: 20,
      total: 57,
      totalPages: 3,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it('carries the summary when given', () => {
    expect(
      paginate([], 0, { page: 1, limit: 20 }, { active: 0 }).summary,
    ).toEqual({ active: 0 });
  });

  it('leaves the summary undefined when not given', () => {
    expect(paginate([], 0, { page: 1, limit: 20 }).summary).toBeUndefined();
  });
});
