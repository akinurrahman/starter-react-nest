import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../errors/index.js';
import { toErrorResponse } from '../filters/all-exceptions.filter.js';

export interface BasicAuthCredentials {
  user: string;
  password: string;
}

// Mounted on plain Express routes (not a Nest controller), so it writes the
// error envelope itself instead of going through AllExceptionsFilter.
export function basicAuth(
  credentials: BasicAuthCredentials,
  realm: string,
): RequestHandler {
  return (req, res, next) => {
    const supplied = parseBasicAuth(req.headers.authorization);
    // Both are always compared, so a wrong user takes as long as a wrong
    // password.
    const userMatches = safeEqual(supplied?.user ?? '', credentials.user);
    const passwordMatches = safeEqual(
      supplied?.password ?? '',
      credentials.password,
    );
    if (supplied && userMatches && passwordMatches) {
      next();
      return;
    }

    const body = toErrorResponse(new UnauthorizedError());
    res
      .status(body.statusCode)
      .setHeader('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
      .json(body);
  };
}

export function parseBasicAuth(
  header: string | undefined,
): BasicAuthCredentials | undefined {
  const match = /^Basic +([A-Za-z0-9+/]+={0,2})$/i.exec(header ?? '');
  if (!match) return undefined;

  const decoded = Buffer.from(match[1], 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return undefined;
  return {
    user: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

// timingSafeEqual needs equal lengths; hashing first gives that without
// revealing the expected length through an early return.
function safeEqual(supplied: string, expected: string): boolean {
  return timingSafeEqual(sha256(supplied), sha256(expected));
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
