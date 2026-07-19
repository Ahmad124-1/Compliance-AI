# ComplianceOS AI

Enterprise compliance management platform — identity, authorization (RBAC) and multi-tenant
foundation with a React/Next.js frontend and a Fastify/PostgreSQL API.

## Monorepo layout

- `apps/web` — Next.js 16 frontend (App Router, React 19, Tailwind v4).
- `apps/api` — Fastify 5 REST API (TypeScript, PostgreSQL, JWT, bcrypt).
- `tooling/` — shared ESLint + Prettier configs.
- `packages/`, `docker/`, `scripts/`, `docs/` — supporting assets.

## Getting started

```bash
pnpm install
cp .env.example .env          # set DATABASE_URL + AUTH_SECRET
docker compose up -d db       # start PostgreSQL
pnpm --filter complianceos-ai-api migrate
pnpm --filter complianceos-ai-api seed
pnpm dev                      # web (3000) + api (4000)
```

## Scripts

- `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` — Turborepo tasks.
- `pnpm --filter complianceos-ai-api migrate|seed|dev` — API lifecycle.

## Status

- **Sprint 0A/0B**: scaffolding + infrastructure ✅
- **Sprint 1**: Identity, RBAC & Multi-Tenant ✅ (see ARCHITECTURE.md, ERD.md, DATABASE.md, API.md)
- **Sprint 4A**: Assessment Framework Engine ✅ (dynamic checklist builder, framework/control mapping, scoring/validation, runtime assessments)
