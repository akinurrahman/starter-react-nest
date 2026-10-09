import { type ArgumentsHost, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { ServiceUnavailableError } from '../errors/index.js';
import {
  AllExceptionsFilter,
  toErrorResponse,
} from './all-exceptions.filter.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('internal prisma detail', {
    code,
    clientVersion: Prisma.prismaVersion.client,
    meta: { target: ['email'] },
  });
}

describe('toErrorResponse (Prisma)', () => {
  it('maps P2002 to 409 CONFLICT', () => {
    expect(toErrorResponse(prismaError('P2002'))).toEqual({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Resource already exists',
    });
  });

  it('maps P2025 to 404 NOT_FOUND', () => {
    expect(toErrorResponse(prismaError('P2025'))).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });
  });

  it('maps other known codes to 500 INTERNAL_ERROR', () => {
    expect(toErrorResponse(prismaError('P2003'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
});

describe('AllExceptionsFilter (ServiceUnavailableError)', () => {
  const SERVICE_UNAVAILABLE = {
    statusCode: 503,
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes 503 through instead of INTERNAL_ERROR, without the cause', () => {
    const error = new ServiceUnavailableError(undefined, undefined, {
      cause: new Error('connect ECONNREFUSED'),
    });

    const body = toErrorResponse(error);

    expect(body).toEqual(SERVICE_UNAVAILABLE);
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
  });

  it('logs the error with its cause attached', () => {
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const cause = new Error('connect ECONNREFUSED');
    const error = new ServiceUnavailableError(undefined, undefined, { cause });

    new AllExceptionsFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(SERVICE_UNAVAILABLE);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(error);
    expect(error.cause).toBe(cause);
  });
});
