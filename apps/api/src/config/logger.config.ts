import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Params } from 'nestjs-pino';
import type { LoggerOptions } from 'pino';
import type { Options } from 'pino-http';
import type { Env } from './env.schema.js';

export type LoggerEnv = Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>;

export const REQUEST_ID_HEADER = 'x-request-id';

const VALID_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Resolved next to this file, so it points at the compiled .js under dist.
const PRETTY_TRANSPORT = fileURLToPath(
  new URL('./pretty-transport.js', import.meta.url),
);

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'token',
  'secret',
];

// Base pino options, kept apart from the HTTP ones so redaction can be tested
// on a plain pino instance.
export function createPinoOptions(env: LoggerEnv): LoggerOptions {
  return {
    level: env.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    ...(env.NODE_ENV === 'development' && {
      transport: { target: PRETTY_TRANSPORT },
    }),
  };
}

export function resolveRequestId(incoming: unknown): string {
  return typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming)
    ? incoming
    : randomUUID();
}

export function createPinoHttpOptions(env: LoggerEnv): Options {
  return {
    ...createPinoOptions(env),
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const id = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
      res.setHeader(REQUEST_ID_HEADER, id);
      return id;
    },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // pino-http wraps these, so they receive the already-serialized req/res.
    serializers: {
      req: (req: { id: unknown; method: string; url: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
  };
}

export function createLoggerParams(env: LoggerEnv): Params {
  return { pinoHttp: createPinoHttpOptions(env) };
}
