# ARCHITECTURE — Sprint 1 (Identity, RBAC & Multi-Tenant)

## Stack

- **API**: Node.js + Fastify 5 (TypeScript, ESM). PostgreSQL via `pg`. JWT (`@fastify/jwt`),
  bcrypt (`bcryptjs`), Zod validation, `tsx` for dev.
- **Web**: Next.js 16 (App Router) + React 19 + TypeScript. TanStack Query, Zustand,
  react-hook-form + Zod, Tailwind v4.
- **Monorepo**: pnpm workspaces + Turborepo (`turbo.json`).

## API layering (SOLID, repository pattern)

```
src/
  config/env.ts            typed env access
  db/
    pool.ts                pg Pool + withTransaction helper
    migrate.ts             ordered SQL migration runner
    seed.ts                consultancy + superadmin seed
    migrations/*.sql
  core/
    logger.ts  errors.ts (AppError hierarchy + Fastify handler)
    password.ts (bcrypt)  crypto.ts (tokens/slug)  tokens.ts (JWT + refresh)
    audit.ts
  repositories/           data access (one per aggregate)
  services/               business logic (auth, user, organization, rbac, tenant)
  routes/                 Fastify route handlers + guard.ts (authenticate, requirePermission)
  server.ts               bootstrap: plugins, error handler, route registration
```

- **Repositories** own SQL + row→entity mapping. **Services** own transactions, invariants and
  cross-aggregate orchestration. **Routes** are thin: parse → authorize → call service → respond.
- **Guard** attaches `request.auth` (JWT claims: `sub`, `org`, `roles`, `perms`). `requirePermission(...)`
  pre-handlers enforce RBAC per route.

## Auth flow

1. `POST /api/v1/auth/login` → access (15m) + refresh (30d, hashed in DB) tokens.
2. Access token sent as `Bearer` on every request; refresh used at `/refresh` (rotates token).
3. Logout revokes the refresh token.

## Multi-tenancy

Every protected route resolves the active organization from the JWT `org` claim. Repositories
always filter by `organization_id`, so cross-tenant data is never visible. The consultancy org is
the platform operator tenant.

## Frontend layering

```
src/
  lib/api/client.ts        typed fetch wrapper (Bearer injection)
  lib/auth/storage.ts      token persistence (localStorage)
  providers/AuthProvider   React context over Zustand store + initial refresh
  components/guards/        ProtectedRoute, Can (permission-gated)
  modules/<name>/          types, constants, validation (zod), api, service, store, index
  app/(auth)/  app/(dashboard)/
```

- Each module follows the same file convention: `module.{types,constants,validation,schema,api,service,store,routes}.ts`.
- Auth store (Zustand, persisted) exposes `hasPermission` / `hasRole` used by route + component guards.
