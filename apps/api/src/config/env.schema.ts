import { z } from 'zod';

export const DEFAULT_CORS_ORIGINS = ['http://localhost:5173'];

// Browsers send `Origin` as scheme://host[:port], lower-case and without a
// default port or trailing slash; requiring that exact form keeps the CORS
// match exact. The URL parser accepts `*` in a host, so wildcards are
// rejected explicitly.
function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin === value &&
      !url.host.includes('*')
    );
  } catch {
    return false;
  }
}

const corsOrigins = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z.string().refine(isOrigin, {
          error:
            'Expected an origin like https://app.example.com (no path, no trailing slash, no wildcard)',
        }),
      )
      .min(1),
  );

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    SWAGGER_ENABLED: z.stringbool().optional(),
    CORS_ORIGINS: corsOrigins.optional(),
    // Number of reverse proxies in front of the app; unset trusts none, so
    // X-Forwarded-For is ignored.
    TRUST_PROXY: z.coerce.number().int().min(1).optional(),
  })
  .refine(
    (env) => env.NODE_ENV !== 'production' || env.CORS_ORIGINS !== undefined,
    { error: 'Required in production', path: ['CORS_ORIGINS'] },
  )
  // These defaults depend on NODE_ENV, so they are resolved after it is parsed.
  .transform((env) => ({
    ...env,
    SWAGGER_ENABLED: env.SWAGGER_ENABLED ?? env.NODE_ENV !== 'production',
    CORS_ORIGINS: env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS,
  }));

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(z.prettifyError(result.error));
    throw new Error('Invalid environment variables');
  }
  return result.data;
}
