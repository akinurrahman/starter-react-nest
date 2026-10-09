import type { IncomingMessage } from 'node:http';
import { Writable } from 'node:stream';
import { pino } from 'pino';
import {
  createPinoHttpOptions,
  createPinoOptions,
  isUnloggedRequest,
} from './logger.config.js';

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
    const logger = pino(
      createPinoOptions({ NODE_ENV: 'test', LOG_LEVEL: 'info' }),
      stream,
    );

    logger.info({
      req: {
        headers: { authorization: 'Bearer abc', cookie: 'sid=abc' },
      },
      password: 'hunter2',
      token: 'tok',
      secret: 'shh',
      email: 'ada@example.com',
    });

    expect(lines).toHaveLength(1);
    const line = JSON.parse(lines[0]) as Record<string, any>;
    expect(line.req.headers.authorization).toBe('[REDACTED]');
    expect(line.req.headers.cookie).toBe('[REDACTED]');
    expect(line.password).toBe('[REDACTED]');
    expect(line.token).toBe('[REDACTED]');
    expect(line.secret).toBe('[REDACTED]');
    expect(line.email).toBe('ada@example.com');
    expect(lines[0]).not.toMatch(/Bearer abc|sid=abc|hunter2/);
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
    const { autoLogging } = createPinoHttpOptions({
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
    });
    const ignore =
      typeof autoLogging === 'object' ? autoLogging.ignore : undefined;

    expect(ignore?.({ url: '/health/ready?a=b' } as IncomingMessage)).toBe(
      true,
    );
    expect(ignore?.({ url: '/healthx' } as IncomingMessage)).toBe(false);
  });
});
