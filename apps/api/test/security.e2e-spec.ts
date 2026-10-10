import { Controller, Get } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import request from 'supertest';
import { RATE_LIMIT } from './../src/config/throttler.config.js';

const TEST_LIMIT = 2;

@Controller('throttle-test')
class ThrottleTestController {
  @Get()
  ping() {
    return { ok: true };
  }
}

// AppModule validates env when it is imported, so each app gets a fresh module
// graph after the env is stubbed. The limit is lowered to keep tests fast.
async function createApp(
  env: Record<string, string | undefined> = {},
): Promise<NestExpressApplication> {
  vi.resetModules();
  vi.stubEnv('TRUST_PROXY', undefined);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);

  const { AppModule } = await import('./../src/app.module.js');
  const { configureHttp } = await import('./../src/config/http.config.js');
  const { setupSwagger } = await import('./../src/config/swagger.config.js');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [ThrottleTestController],
  })
    .overrideProvider(getOptionsToken())
    .useValue([{ ...RATE_LIMIT, limit: TEST_LIMIT }])
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureHttp(app);
  setupSwagger(app);
  await app.init();
  return app;
}

describe('Rate limiting (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('sends rate limit headers while under the limit', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/throttle-test')
      .expect(200);

    expect(res.headers['x-ratelimit-limit']).toBe(String(TEST_LIMIT));
    expect(res.headers['x-ratelimit-remaining']).toBe(String(TEST_LIMIT - 1));
  });

  it('answers 429 in the error envelope with Retry-After once exceeded', async () => {
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app.getHttpServer()).get('/api/throttle-test').expect(200);
    }

    const res = await request(app.getHttpServer())
      .get('/api/throttle-test')
      .expect(429)
      .expect({
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, try again later',
      });

    const retryAfter = Number(res.headers['retry-after']);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(RATE_LIMIT.ttl / 1000);
  });

  it.each(['/health', '/health/ready'])('never throttles %s', async (path) => {
    for (let i = 0; i < TEST_LIMIT * 3; i++) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.headers).not.toHaveProperty('x-ratelimit-limit');
    }
  });
});

describe('TRUST_PROXY (e2e)', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  async function exhaust(clientIp: string) {
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app!.getHttpServer())
        .get('/api/throttle-test')
        .set('X-Forwarded-For', clientIp)
        .expect(200);
    }
  }

  it('throttles each forwarded client separately when set', async () => {
    app = await createApp({ TRUST_PROXY: '1' });
    await exhaust('203.0.113.1');

    await request(app.getHttpServer())
      .get('/api/throttle-test')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(429);
    await request(app.getHttpServer())
      .get('/api/throttle-test')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(200);
  });

  it('ignores X-Forwarded-For when unset', async () => {
    app = await createApp();
    await exhaust('203.0.113.1');

    // A spoofed header does not get the client a fresh budget.
    await request(app.getHttpServer())
      .get('/api/throttle-test')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(429);
  });
});
