# auth module

Authentication + session management.

- `module.store.ts` — Zustand auth store (persisted), `hasPermission` / `hasRole`
- `module.api.ts` / `module.service.ts` — login, register, logout, refresh, password + email flows
- `module.validation.ts` — Zod schemas for every auth form
- `module.routes.ts` — auth route map

Wired into the app via `providers/AuthProvider.tsx`; protected UI uses `components/guards/RouteGuard.tsx`.
