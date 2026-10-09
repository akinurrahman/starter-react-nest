export interface FieldError {
  path: string;
  message: string;
  code: string;
}

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
