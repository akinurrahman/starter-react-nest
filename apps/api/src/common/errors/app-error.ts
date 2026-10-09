import type { FieldError } from './error-response.js';

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}
