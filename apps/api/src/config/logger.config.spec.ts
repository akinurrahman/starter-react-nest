import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Writable } from 'node:stream';
import { pino } from 'pino';
import {
  createHttpLogger,
  createPinoHttpOptions,
  createPinoOptions,
  isUnloggedRequest,
  REQUEST_ID_HEADER,
} from './logger.config.js';

const ENV = { NODE_ENV: 'test', LOG_LEVEL: 'info' } as const;

function memoryStream() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { stream, lines };
}

describe('createPinoOptions', () => {
  it('redacts credentials and secrets', () => {
    const { stream, lines } = memoryStream();
    const logger = pino(createPinoOptions(ENV), stream);

    logger.info({
      req: {
        headers: { authorization: 'Bearer abc', cookie: 'sid=abc' },
      },
      password: 'hunter2',
      passwordHash: 'hash',
      token: 'tok',
      secret: 'shh',
      email: 'ada@example.com',
    });

    expect(lines).toHaveLength(1);
    const line = JSON.parse(lines[0]) as Record<string, any>;
    expect(line.req.headers.authorization).toBe('[REDACTED]');
    expect(line.req.headers.cookie).toBe('[REDACTED]');
    expect(line.password).toBe('[REDACTED]');
    expect(line.passwordHash).toBe('[REDACTED]');
    expect(line.token).toBe('[REDACTED]');
    expect(line.secret).toBe('[REDACTED]');
    expect(line.email).toBe('ada@example.com');
    expect(lines[0]).not.toMatch(/Bearer abc|sid=abc|hunter2/);
  });

  it('redacts secrets one level down', () => {
    const { stream, lines } = memoryStream();
    const logger = pino(createPinoOptions(ENV), stream);

    logger.info({
      user: {
        email: 'ada@example.com',
        password: 'hunter2',
        passwordHash: 'hash-value',
      },
      session: { token: 'tok-value', secret: 'shh-value' },
    });

    const line = JSON.parse(lines[0]) as Record<string, any>;
    expect(line.user).toEqual({
      email: 'ada@example.com',
      password: '[REDACTED]',
      passwordHash: '[REDACTED]',
    });
    expect(line.session).toEqual({
      token: '[REDACTED]',
      secret: '[REDACTED]',
    });
  });
});

describe('isUnloggedRequest', () => {
  it.each(['/health', '/health/ready', '/health?probe=1', '/health/ready?a=b'])(
    'skips %s',
    (url) => {
      expect(isUnloggedRequest(url)).toBe(true);
    },
  );

  it.each([
    '/healthx',
    '/health/readyx',
    '/health/',
    '/health/ready/',
    '/health/live',
    '/api/health',
    '/',
    undefined,
  ])('logs %s', (url) => {
    expect(isUnloggedRequest(url)).toBe(false);
  });

  it('is wired into pino-http autoLogging', () => {
    const { autoLogging } = createPinoHttpOptions(ENV);
    const ignore =
      typeof autoLogging === 'object' ? autoLogging.ignore : undefined;

    expect(ignore?.({ url: '/health/ready?a=b' } as IncomingMessage)).toBe(
      true,
    );
    expect(ignore?.({ url: '/healthx' } as IncomingMessage)).toBe(false);
  });
});

describe('createHttpLogger', () => {
  const { stream, lines } = memoryStream();
  let server: Server;
  let base: string;

  beforeAll(async () => {
    const httpLogger = createHttpLogger(ENV, stream);
    server = createServer((req, res) => {
      httpLogger(req, res);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    lines.length = 0;
  });

  it('sets the request ID header and logs the same ID', async () => {
    const res = await fetch(`${base}/users`);

    const id = res.headers.get(REQUEST_ID_HEADER);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect((JSON.parse(lines[0]) as Record<string, any>).req.id).toBe(id);
  });
});
