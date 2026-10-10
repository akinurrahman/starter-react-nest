import { stdSerializers } from 'pino';
import { Prisma } from '../generated/prisma/client.js';

// These put query data in their message: a validation error prints the call's
// arguments, a raw query error the database's message, which can quote input
// values. Only their code and a few metadata fields are logged.
const QUERY_ERRORS = [
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientValidationError,
];

// pino's `err` serializer, with Prisma query errors replaced anywhere in the
// cause chain unless `scrubQueryErrors` is off. pino-http wraps it and hands it
// an already serialized error, whose `raw` is the original.
export function createErrorSerializer(
  scrubQueryErrors: boolean,
): (err: unknown) => unknown {
  return (err) => {
    const source = (err as { raw?: unknown } | undefined)?.raw ?? err;
    return stdSerializers.err(
      (scrubQueryErrors ? scrub(source, new Set()) : source) as Error,
    );
  };
}

function scrub(err: unknown, seen: Set<unknown>): unknown {
  if (!(err instanceof Error) || seen.has(err)) return err;
  seen.add(err);

  const cause = scrub(err.cause, seen);
  if (QUERY_ERRORS.some((type) => err instanceof type)) {
    return scrubbedPrismaError(err, cause);
  }
  return cause === err.cause ? err : copyWithCause(err, cause);
}

function scrubbedPrismaError(err: Error, cause: unknown): Error {
  const { code, clientVersion, meta } = err as {
    code?: string;
    clientVersion?: string;
    meta?: unknown;
  };
  const message = `${code ?? 'Query error'} (message not logged: it can contain query data)`;
  // The stack starts with the message, so only its frames are kept.
  const stack = err.stack ?? '';
  const framesAt = stack.indexOf('\n    at ');
  const frames = framesAt === -1 ? '' : stack.slice(framesAt);

  const copy = Object.assign(Object.create(Object.getPrototypeOf(err)), {
    name: err.name,
    message,
    stack: `${err.name}: ${message}${frames}`,
    code,
    clientVersion,
    meta: safeMeta(meta),
  }) as Error;
  return withCause(copy, cause);
}

// Names only, never values: the model, the target fields and the database's
// error kind and code.
function safeMeta(meta: unknown) {
  if (!isRecord(meta)) return undefined;
  const adapterError = isRecord(meta.driverAdapterError)
    ? meta.driverAdapterError
    : {};
  const adapterCause = isRecord(adapterError.cause) ? adapterError.cause : {};
  return {
    modelName: meta.modelName,
    target: meta.target,
    kind: adapterCause.kind,
    originalCode: adapterCause.originalCode,
  };
}

function copyWithCause(err: Error, cause: unknown): Error {
  const copy = Object.assign(Object.create(Object.getPrototypeOf(err)), err, {
    message: err.message,
    stack: err.stack,
  }) as Error;
  return withCause(copy, cause);
}

// Non-enumerable, like `cause` set through the Error constructor, so the
// serializer follows it as a cause instead of copying it as a field.
function withCause(err: Error, cause: unknown): Error {
  if (cause !== undefined) {
    Object.defineProperty(err, 'cause', {
      value: cause,
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  return err;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
