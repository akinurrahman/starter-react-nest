import { ServiceUnavailableError } from '../common/errors/index.js';
import type { HealthRepository } from './health.repository.js';
import { DATABASE_PING_TIMEOUT_MS, HealthService } from './health.service.js';

function serviceWith(ping: () => Promise<void>) {
  return new HealthService({ ping } as HealthRepository);
}

describe('HealthService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports liveness without touching the database', () => {
    const ping = vi.fn<() => Promise<void>>();

    expect(serviceWith(ping).liveness()).toEqual({ status: 'ok' });
    expect(ping).not.toHaveBeenCalled();
  });

  it('is ready when the ping resolves', async () => {
    const service = serviceWith(() => Promise.resolve());

    await expect(service.readiness()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('throws ServiceUnavailableError carrying the cause when the ping rejects', async () => {
    const cause = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    const service = serviceWith(() => Promise.reject(cause));

    const error: unknown = await service.readiness().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error).toMatchObject({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service unavailable',
    });
    expect((error as Error).cause).toBe(cause);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives up on a hung ping after the timeout', async () => {
    const service = serviceWith(() => new Promise<void>(() => {}));

    let error: unknown;
    const settled = service.readiness().catch((e: unknown) => {
      error = e;
    });

    await vi.advanceTimersByTimeAsync(DATABASE_PING_TIMEOUT_MS - 1);
    expect(error).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    await settled;

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    const cause = (error as Error).cause;
    expect(cause).toBeInstanceOf(Error);
    expect((cause as Error).message).toBe('Timed out after 2000ms');
    expect(vi.getTimerCount()).toBe(0);
  });
});
