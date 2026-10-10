import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Env } from './env.schema.js';
import { REQUEST_ID_HEADER } from './logger.config.js';

export const API_PREFIX = 'api';

// Probes are configured against fixed paths, so they stay outside the prefix.
// Exclusions match exactly: each path is listed on its own.
export const UNPREFIXED_PATHS = ['health', 'health/ready'];

// Must run before setupSwagger: the prefix ends up in the documented paths,
// and helmet must be registered ahead of the docs routes.
export function configureHttp(app: INestApplication): void {
  const allowedOrigins = new Set(
    app.get(ConfigService<Env, true>).get('CORS_ORIGINS', { infer: true }),
  );

  app.setGlobalPrefix(API_PREFIX, { exclude: UNPREFIXED_PATHS });
  app.use(helmet());
  app.enableCors({
    // A callback rather than the list itself: when it answers false, `cors`
    // skips the request entirely, so a disallowed origin gets no CORS headers
    // at all (with a list it still sends Access-Control-Allow-Credentials).
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => callback(null, origin !== undefined && allowedOrigins.has(origin)),
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
}
