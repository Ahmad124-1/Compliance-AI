# src/modules

Feature modules. Each module follows a consistent file convention:

- `module.types.ts` — domain types (mirror API responses)
- `module.constants.ts` — endpoints, route paths, storage keys
- `module.validation.ts` — Zod validation schemas
- `module.schema.ts` — DTO mappers (form → API)
- `module.api.ts` — typed HTTP client wrappers
- `module.service.ts` — client service layer
- `module.store.ts` — React Query hooks / Zustand store
- `module.routes.ts` — route map + permission metadata
- `index.ts` — public entry

Modules: `auth`, `rbac`, `tenants`, `users`.
