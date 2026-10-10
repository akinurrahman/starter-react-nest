import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  type ErrorResponse,
} from '../errors/index.js';

const INTERNAL_ERROR: ErrorResponse = {
  statusCode: 500,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

const DEFAULT_ERRORS: Record<number, () => AppError> = {
  400: () => new BadRequestError(),
  401: () => new UnauthorizedError(),
  403: () => new ForbiddenError(),
  404: () => new NotFoundError(),
  409: () => new ConflictError(),
  // ThrottlerException lands here; the guard has already set Retry-After.
  429: () => new TooManyRequestsError(),
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = toErrorResponse(exception);

    // Passing the Error itself (not message + stack) lets pino serialize it,
    // including any `cause` chain.
    if (body.statusCode >= 500) this.logger.error(exception);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(body.statusCode)
      .json(body);
  }
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    return {
      statusCode: exception.statusCode,
      code: exception.code,
      message: exception.message,
      ...(exception.errors && { errors: exception.errors }),
    };
  }

  // Must come before HttpException: ZodValidationException extends BadRequestException.
  if (exception instanceof ZodValidationException) {
    const zodError = exception.getZodError();
    return {
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      errors:
        zodError instanceof ZodError
          ? zodError.issues.map((issue) => ({
              path: issue.path.map(String).join('.'),
              message: issue.message,
              code: issue.code,
            }))
          : [],
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: 409,
          code: 'CONFLICT',
          message: 'Resource already exists',
        };
      case 'P2025':
        return {
          statusCode: 404,
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      default:
        return INTERNAL_ERROR;
    }
  }

  // Raw HttpExceptions come from the framework or a library, never our code,
  // so their messages are never passed through.
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 500) return INTERNAL_ERROR;
    return genericResponse(status);
  }

  // Express middleware (body-parser: 413, 415, ...) throws http-errors: plain
  // Errors with a 4xx `status` and `expose: true`. Only the status is used.
  const clientStatus = clientErrorStatus(exception);
  if (clientStatus !== undefined) return genericResponse(clientStatus);

  return INTERNAL_ERROR;
}

function clientErrorStatus(exception: unknown): number | undefined {
  if (!(exception instanceof Error)) return undefined;
  const { status, expose } = exception as {
    status?: unknown;
    expose?: unknown;
  };
  return expose === true &&
    typeof status === 'number' &&
    status >= 400 &&
    status < 500
    ? status
    : undefined;
}

function genericResponse(status: number): ErrorResponse {
  return {
    statusCode: status,
    code: codeFor(status),
    message: genericMessage(status),
  };
}

function codeFor(status: number): string {
  const name: unknown = HttpStatus[status];
  return typeof name === 'string' ? name : `HTTP_${status}`;
}

function genericMessage(status: number): string {
  const domainDefault = DEFAULT_ERRORS[status];
  if (domainDefault) return domainDefault().message;
  const words = codeFor(status).toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
