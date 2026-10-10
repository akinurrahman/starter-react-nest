# CLAUDE.md

Monorepo starter template: NestJS API now, React web app and shared package coming.
Every rule here is decided. If something seems wrong, ask before working around it.

## Stack

Node 24, pnpm 10.18, Turborepo 2.11, TypeScript 6, NestJS 12 (ESM), Prisma 7.10 with
@prisma/adapter-pg, Postgres 18.6 in Docker, Zod 4 + nestjs-zod, nestjs-pino, Vitest 4, Oxlint.

- Prisma 7 and Turbo 2 may differ from your training data. Read `.claude/skills/prisma-*`
  or the installed docs before changing Prisma code or config. Don't upgrade Prisma to 8.
- All deps are pinned exact (`save-exact=true`). New deps: pin exact, check peer ranges
  against Nest 12, ask before adding a `peerDependencyRules` override.
- Temporary: the nestjs-zod overrides (`@nestjs/common`, `@nestjs/swagger`) in the root
  package.json go once nestjs-zod declares Nest 12.

## Commands

Run from the repo root. One app only: `pnpm --filter @starter/api <script>`.

| Task | Command |
|---|---|
| DB up | `docker compose up -d` |
| Dev | `pnpm dev` |
| Typecheck / lint | `pnpm typecheck` / `pnpm lint` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm test:e2e` (Postgres must be running) |
| Format | `pnpm --filter @starter/api format` |
| Build | `pnpm build` |
| Regenerate Prisma client | `pnpm --filter @starter/api db:generate` |
| Apply migrations | `pnpm --filter @starter/api db:deploy` |

New migration: `pnpm --filter @starter/api exec prisma migrate dev --create-only --name <name>`,
show the SQL and wait for approval, then `pnpm --filter @starter/api db:migrate`.
Don't pass `--name` to `db:migrate`: it lands on the chained `prisma generate`.

The dev shell may be PowerShell on Windows. Prefer commands that work in both.

## Layout (apps/api)

- `src/config/`: env schema, `configureApp`, http, swagger, logger, throttler
- `src/common/`: errors, filter, interceptor, pagination, swagger decorators, middleware
- `src/database/`: PrismaService
- `src/health/`: reference module layout (dto, repository, service, controller, module)
- `src/generated/`: Prisma client, gitignored, never edit
- `prisma/schema.prisma`: generator and datasource only. Models in `prisma/models/<domain>.prisma`
- `test/`: e2e specs

## Backend rules

- ESM: `.js` extension on every relative import.
- New modules follow `src/health/` until the users golden module exists.
- Only repositories inject PrismaService.
- Services throw AppError subclasses from `src/common/errors`, never HttpException.
  Use specific codes (`new NotFoundError('USER_NOT_FOUND', 'User not found')`). Check
  conflicts yourself, don't rely on the P2002/P2025 safety net. Attach a cause with the
  options argument when there is one.
- `src/common/errors` imports nothing from Nest.
- Controllers return plain values. Never write `{ data }` by hand, the interceptor wraps.
  Paginated lists return `paginate(items, total, query, summary?)` and take `PaginationQueryDto`.
- DTOs: a Zod schema plus `class XDto extends createZodDto(XSchema) {}`. Schemas move to
  `packages/shared` once it exists.
- Document every endpoint: `ApiDataResponse`, `ApiPaginatedResponse`, `ApiErrorResponses`.
- New routes land under `/api` automatically. Only probes are unprefixed and unthrottled.
- `configureApp` is the only app setup. `main.ts` and every e2e spec use it. Nothing
  registers routes or middleware after it.
- Env: add new vars to `env.schema.ts` and `.env.example`. Read config through
  ConfigService, not `process.env`.
- Never log request bodies or user data. Redaction is a safety net, not permission.
  Prisma error messages are only logged in development.

## Database

- Prisma names are camelCase, mapped to snake_case with `@map` / `@@map`.
- IDs: `uuid(7)` stored as `@db.Uuid`.
- Never edit a migration that has run outside your machine. Make a new one.

## Tests

- Unit: `*.spec.ts` next to the code, never touch the DB (override PrismaService or the repository).
- E2E: `test/*.e2e-spec.ts`, real AppModule through `configureApp`, test-only controllers
  for anything not yet in the app.
- Tests go in the same commit as the code they cover.
- Mutation-check new tests: break the code, confirm a test fails, restore.

## Git

- Conventional commits, one reason per commit. Each commit must pass typecheck and tests.
- Don't commit until told "commit". Never push unless told.
- Ask before doing anything outside the task. Report anything you did that wasn't asked for.
- LF line endings everywhere (`.editorconfig`, `.gitattributes`).
