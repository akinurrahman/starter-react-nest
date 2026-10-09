import {
  build,
  type MessageFormatFunc,
  type Prettifier,
  type PrettyOptions,
} from 'pino-pretty';

// Dev-only pino transport. Loaded by file path inside pino's worker thread,
// which is why the formatting functions live here: transport options must be
// serializable.

interface RequestLog {
  req: { id: unknown; method: string; url: string };
  res: { statusCode: number };
  responseTime: number;
}

// pino-http adds responseTime only to its finished-request line.
function isRequestLine(log: object): log is RequestLog {
  return 'responseTime' in log;
}

export const formatMessage: MessageFormatFunc = (log, messageKey) => {
  if (isRequestLine(log)) {
    const { req, res, responseTime } = log;
    const shortId = String(req.id).slice(0, 8);
    return `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms ${shortId}`;
  }
  const msg = log[messageKey];
  return typeof msg === 'string' ? msg : '';
};

// Same set pino-pretty strips by default. A custom prettifier opts out of its
// stack sanitizing, so it is redone here.
// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;

// Returning undefined makes pino-pretty skip the key; other lines keep the
// default pretty JSON.
const hideOnRequestLine: Prettifier = (value, _key, log) =>
  (isRequestLine(log)
    ? undefined
    : JSON.stringify(
        value,
        (_k, v: unknown) =>
          typeof v === 'string' ? v.replace(UNSAFE_CONTROL_CHARS, '') : v,
        2,
      )) as unknown as string;

export const prettyOptions: PrettyOptions = {
  ignore: 'pid,hostname',
  messageFormat: formatMessage,
  customPrettifiers: {
    req: hideOnRequestLine,
    res: hideOnRequestLine,
    responseTime: hideOnRequestLine,
    // pino-http's synthetic "failed with status code 5xx" error; the real
    // stack is logged by AllExceptionsFilter.
    err: hideOnRequestLine,
  },
};

export default function prettyTransport(opts: PrettyOptions = {}) {
  return build({ ...opts, ...prettyOptions });
}
