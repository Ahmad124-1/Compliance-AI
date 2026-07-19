# API App

Fastify 5 REST API for ComplianceOS AI.

- `src/server.ts` — bootstrap (plugins, error handler, routes)
- `src/db` — pool, migrations, seed
- `src/core` — errors, password, tokens, audit, crypto, logger
- `src/repositories` — data access (repository pattern)
- `src/services` — business logic
- `src/routes` — HTTP handlers + guards

Run: `pnpm dev` · Migrate: `pnpm migrate` · Seed: `pnpm seed`

See `../../API.md` for the endpoint reference.
