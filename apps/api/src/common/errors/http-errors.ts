import { AppError } from './app-error.js';

export class BadRequestError extends AppError {
  constructor(code = 'BAD_REQUEST', message = 'Bad request') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Authentication required') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'Access denied') {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Resource not found') {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Resource already exists') {
    super(409, code, message);
  }
}

// `cause` is logged by AllExceptionsFilter but never sent to the client.
export class ServiceUnavailableError extends AppError {
  constructor(
    code = 'SERVICE_UNAVAILABLE',
    message = 'Service unavailable',
    options?: ErrorOptions,
  ) {
    super(503, code, message, undefined, options);
  }
}
