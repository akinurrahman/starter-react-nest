import { envSchema } from './env.schema.js';

const base = { DATABASE_URL: 'postgresql://localhost:5432/unused' };

function corsOrigins(env: Record<string, string>) {
  return envSchema.parse({ ...base, ...env }).CORS_ORIGINS;
}

function corsIssue(env: Record<string, string>) {
  const result = envSchema.safeParse({ ...base, ...env });
  expect(result.success).toBe(false);
  return result.error?.issues.find((issue) => issue.path[0] === 'CORS_ORIGINS');
}

describe('CORS_ORIGINS', () => {
  it('defaults to the Vite dev server outside production', () => {
    expect(corsOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:5173',
    ]);
    expect(corsOrigins({ NODE_ENV: 'test' })).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('is required in production', () => {
    expect(corsIssue({ NODE_ENV: 'production' })?.message).toBe(
      'Required in production',
    );
  });

  it('accepts a list in production', () => {
    expect(
      corsOrigins({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com',
      }),
    ).toEqual(['https://app.example.com']);
  });

  it('splits on commas, trims and drops empty entries', () => {
    expect(
      corsOrigins({
        CORS_ORIGINS:
          ' https://app.example.com , http://localhost:3000,,https://admin.example.com:8443 ',
      }),
    ).toEqual([
      'https://app.example.com',
      'http://localhost:3000',
      'https://admin.example.com:8443',
    ]);
  });

  it.each([
    ['a wildcard', '*'],
    ['a wildcard among origins', 'https://app.example.com,*'],
    ['a subdomain wildcard', 'https://*.example.com'],
    ['a trailing slash', 'https://app.example.com/'],
    ['a path', 'https://app.example.com/app'],
    ['a missing scheme', 'app.example.com'],
    ['a non-http scheme', 'ftp://app.example.com'],
    ['an explicit default port', 'https://app.example.com:443'],
    ['an upper-case host', 'https://App.example.com'],
    ['the null origin', 'null'],
  ])('rejects %s', (_, value) => {
    expect(corsIssue({ CORS_ORIGINS: value })).toBeDefined();
  });

  it.each([
    ['empty', ''],
    ['only commas', ' , ,'],
  ])('rejects a value that is %s', (_, value) => {
    expect(corsIssue({ CORS_ORIGINS: value })).toBeDefined();
  });
});
