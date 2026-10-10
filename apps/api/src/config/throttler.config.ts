import type { ThrottlerOptions } from '@nestjs/throttler';

// Per client IP (`req.ip`, so behind a proxy it depends on TRUST_PROXY).
// Named `default` so the guard sends plain Retry-After / X-RateLimit-*
// headers; any other name is appended to each header.
export const RATE_LIMIT = {
  name: 'default',
  ttl: 60_000,
  limit: 100,
} satisfies ThrottlerOptions;
