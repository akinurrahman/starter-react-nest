import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Params } from 'nestjs-pino';
import { pino, type DestinationStream, type LoggerOptions } from 'pino';
import { pinoHttp, type HttpLogger, type Options } from 'pino-http';
import type { Env } from './env.schema.js';

export type LoggerEnv = Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>;

export const REQUEST_ID_HEADER = 'x-request-id';

// The app's one pino-http middleware. configureApp mounts it ahead of every
// other middleware, so requests that fail in body parsing or the docs' basic
// auth are logged and get a request ID too; nestjs-pino reuses its logger
// instead of mounting its own after body parsing.
export const HTTP_LOGGER = Symbol('HTTP_LOGGER');

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

// Probes hit these every few seconds; logging each one would drown real traffic.
const UNLOGGED_PATHS = new Set(['/health', '/health/ready']);

export function isUnloggedRequest(url: string | undefined): boolean {
  return url !== undefined && UNLOGGED_PATHS.has(url.split('?', 1)[0]);
}

export function createPinoHttpOptions(): Options {
  return {
    autoLogging: { ignore: (req) => isUnloggedRequest(req.url) },
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

// `destination` is for tests; the default is stdout.
export function createHttpLogger(
  env: LoggerEnv,
  destination?: DestinationStream,
): HttpLogger {
  return pinoHttp({
    ...createPinoHttpOptions(),
    logger: pino(createPinoOptions(env), destination),
  });
}

export function createLoggerParams(httpLogger: HttpLogger): Params {
  return {
    // Not wrapped again, so the root logger keeps httpLogger's serializers.
    pinoHttp: { logger: httpLogger.logger, wrapSerializers: false },
    useExisting: true,
  };
}
