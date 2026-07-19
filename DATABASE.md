# DATABASE

PostgreSQL 16. Connection via `DATABASE_URL`. Migrations are plain SQL, ordered and idempotent
per file (tracked in `_migrations`).

## Run migrations

```bash
pnpm --filter complianceos-ai-api migrate
```

## Seed

Creates the **consultancy** tenant, a `superadmin` user (`admin@complianceos.ai`) and a full-access
`superadmin` role. Idempotent.

```bash
pnpm --filter complianceos-ai-api seed
```

## Schema

See `ERD.md` for the entity diagram. Tables created in `apps/api/src/db/migrations/0001_multi_tenant_core.sql`:

- `organizations`, `sites`, `departments`, `teams` — tenant hierarchy
- `users`, `user_memberships` — identity + scoping
- `permissions`, `permission_groups`, `permission_group_items` — authorization catalogue
- `roles`, `role_permissions`, `role_permission_groups` — role definitions
- `user_roles` — user↔role assignment (organization-scoped, supports multiple roles)
- `refresh_tokens` — revocable refresh tokens (sha256 hashed)
- `audit_logs` — immutable identity/tenant event trail

## Conventions

- UUID primary keys (`gen_random_uuid()`), `created_at`/`updated_at` timestamps.
- Soft-disable via `users.status` / `is_active` columns (no hard deletes for tenants).
- All JSON columns use `jsonb`.
- Cascade deletes: child tenant rows delete with their organization.
