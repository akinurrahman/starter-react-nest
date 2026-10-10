import { ERROR_CODES } from '@starter/shared';
import { AppError } from './app-error.js';

export class BadRequestError extends AppError {
  constructor(code: string = ERROR_CODES.BAD_REQUEST, message = 'Bad request') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    code: string = ERROR_CODES.UNAUTHORIZED,
    message = 'Authentication required',
  ) {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: string = ERROR_CODES.FORBIDDEN, message = 'Access denied') {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(
    code: string = ERROR_CODES.NOT_FOUND,
    message = 'Resource not found',
  ) {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(
    code: string = ERROR_CODES.CONFLICT,
    message = 'Resource already exists',
  ) {
    super(409, code, message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    code: string = ERROR_CODES.TOO_MANY_REQUESTS,
    message = 'Too many requests, try again later',
  ) {
    super(429, code, message);
  }
}

// `cause` is logged by AllExceptionsFilter but never sent to the client.
export class ServiceUnavailableError extends AppError {
  constructor(
    code: string = ERROR_CODES.SERVICE_UNAVAILABLE,
    message = 'Service unavailable',
    options?: ErrorOptions,
  ) {
    super(503, code, message, undefined, options);
  }
}
