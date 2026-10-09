import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { PaginatedResult } from '../pagination/index.js';

// Wraps successful responses only; errors bypass `map` and reach the filter.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map(toResponseBody));
  }
}

export function toResponseBody(value: unknown): unknown {
  if (value === undefined || value instanceof StreamableFile) return value;

  if (value instanceof PaginatedResult) {
    return {
      data: value.items,
      pagination: value.pagination,
      ...(value.summary !== undefined && { summary: value.summary }),
    };
  }

  return { data: value };
}
