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

describe('TRUST_PROXY', () => {
  function parse(env: Record<string, string>) {
    return envSchema.safeParse({ ...base, ...env });
  }

  it('is off by default', () => {
    expect(parse({}).data?.TRUST_PROXY).toBeUndefined();
  });

  it('parses a hop count', () => {
    expect(parse({ TRUST_PROXY: '2' }).data?.TRUST_PROXY).toBe(2);
  });

  it.each([
    ['zero', '0'],
    ['empty', ''],
    ['negative', '-1'],
    ['a fraction', '1.5'],
    ['a boolean', 'true'],
    ['an address', '10.0.0.0/8'],
  ])('rejects %s', (_, value) => {
    expect(parse({ TRUST_PROXY: value }).success).toBe(false);
  });
});

describe('SWAGGER_USER / SWAGGER_PASSWORD', () => {
  const PROD = { NODE_ENV: 'production', CORS_ORIGINS: 'https://app.example' };
  const CREDENTIALS = { SWAGGER_USER: 'docs', SWAGGER_PASSWORD: 'secret' };

  function issuePaths(env: Record<string, string>) {
    const result = envSchema.safeParse({ ...base, ...env });
    return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
  }

  it('are optional outside production', () => {
    expect(issuePaths({ NODE_ENV: 'development' })).toEqual([]);
  });

  it('are not needed in production while the docs are off', () => {
    expect(issuePaths(PROD)).toEqual([]);
    expect(issuePaths({ ...PROD, SWAGGER_ENABLED: 'false' })).toEqual([]);
  });

  it('are both required when the docs are on in production', () => {
    expect(issuePaths({ ...PROD, SWAGGER_ENABLED: 'true' })).toEqual([
      'SWAGGER_USER',
      'SWAGGER_PASSWORD',
    ]);
  });

  it('are accepted when the docs are on in production', () => {
    expect(
      issuePaths({ ...PROD, SWAGGER_ENABLED: 'true', ...CREDENTIALS }),
    ).toEqual([]);
  });

  it('must be set together', () => {
    expect(issuePaths({ SWAGGER_USER: 'docs' })).toEqual(['SWAGGER_PASSWORD']);
    expect(issuePaths({ SWAGGER_PASSWORD: 'secret' })).toEqual([
      'SWAGGER_USER',
    ]);
  });

  it('rejects empty values', () => {
    expect(
      issuePaths({ SWAGGER_USER: '', SWAGGER_PASSWORD: 'secret' }),
    ).toContain('SWAGGER_USER');
  });
});
