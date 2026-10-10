import { errorResponseSchema, fieldErrorSchema } from './error-response.js';

describe('errorResponseSchema', () => {
  const body = {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Resource not found',
  };

  it('accepts a body without field errors', () => {
    expect(errorResponseSchema.parse(body)).toEqual(body);
  });

  it('accepts a body with field errors', () => {
    const withErrors = {
      ...body,
      statusCode: 400,
      errors: [{ path: 'name', message: 'Required', code: 'invalid_type' }],
    };
    expect(errorResponseSchema.parse(withErrors)).toEqual(withErrors);
  });

  it('accepts a code outside ERROR_CODES', () => {
    const future = { ...body, code: 'SOME_FUTURE_CODE' };
    expect(errorResponseSchema.parse(future)).toEqual(future);
  });

  it('rejects a non-integer status code', () => {
    expect(
      errorResponseSchema.safeParse({ ...body, statusCode: 400.5 }).success,
    ).toBe(false);
  });

  it('rejects a body without a code', () => {
    const { code: _, ...missing } = body;
    expect(errorResponseSchema.safeParse(missing).success).toBe(false);
  });
});

describe('fieldErrorSchema', () => {
  it('requires path, message and code', () => {
    expect(
      fieldErrorSchema.safeParse({ path: 'name', message: 'Required' }).success,
    ).toBe(false);
  });
});
