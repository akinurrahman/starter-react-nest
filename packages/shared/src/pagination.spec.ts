import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  paginationMetaSchema,
  paginationQuerySchema,
} from './pagination.js';

describe('page limits', () => {
  it('are 20 by default and 100 at most', () => {
    expect(DEFAULT_PAGE_LIMIT).toBe(20);
    expect(MAX_PAGE_LIMIT).toBe(100);
  });
});

describe('paginationQuerySchema', () => {
  it('defaults page to 1 and limit to 20', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('coerces query-string numbers', () => {
    expect(paginationQuerySchema.parse({ page: '3', limit: '50' })).toEqual({
      page: 3,
      limit: 50,
    });
  });

  it('accepts a limit of 100', () => {
    expect(paginationQuerySchema.parse({ limit: '100' }).limit).toBe(100);
  });

  it('rejects a limit over 100', () => {
    expect(paginationQuerySchema.safeParse({ limit: '101' }).success).toBe(
      false,
    );
  });

  it.each([
    ['page', '0'],
    ['limit', '0'],
    ['page', '1.5'],
    ['limit', 'abc'],
  ])('rejects %s=%s', (key, value) => {
    expect(paginationQuerySchema.safeParse({ [key]: value }).success).toBe(
      false,
    );
  });
});

describe('paginationMetaSchema', () => {
  const meta = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  };

  it('accepts a complete meta object', () => {
    expect(paginationMetaSchema.parse(meta)).toEqual(meta);
  });

  it('requires every field', () => {
    const { hasNext: _, ...missing } = meta;
    expect(paginationMetaSchema.safeParse(missing).success).toBe(false);
  });

  it('does not coerce', () => {
    expect(paginationMetaSchema.safeParse({ ...meta, page: '1' }).success).toBe(
      false,
    );
  });
});
