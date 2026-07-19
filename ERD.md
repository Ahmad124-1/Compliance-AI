# ERD — Identity, RBAC & Multi-Tenant

Sprint 1 data model. All tenant-scoped tables carry `organization_id`.

```
organizations
  id (PK, uuid)
  name, slug (unique), kind ('consultancy' | 'client')
  logo_url, branding (jsonb), settings (jsonb)
  is_active, created_at, updated_at
      │ 1
      │
      ├──< sites
      │       id, organization_id (FK), name, code, address (jsonb), is_active
      │
      ├──< departments
      │       id, organization_id (FK), site_id (FK, nullable), name, code, is_active
      │
      ├──< teams
      │       id, organization_id (FK), department_id (FK, nullable), name, code, is_active
      │
      ├──< users
      │       id, organization_id (FK), email (unique), password_hash
      │       first_name, last_name, avatar_url, locale, preferences (jsonb)
      │       status ('invited'|'active'|'disabled'), email_verified
      │       email_verification_token, email_verification_expires_at
      │       password_reset_token, password_reset_expires_at
      │       last_login_at, created_at, updated_at
      │
      ├──< user_memberships
      │       user_id, organization_id, site_id?, department_id?, team_id?
      │
      ├──< roles
      │       id, organization_id (FK), name, key (unique per org), description
      │       is_system, is_active
      │
      └──< audit_logs
              id, organization_id?, actor_id?, action, entity, entity_id, metadata, created_at

users >---< roles                 (user_roles: user_id, role_id, organization_id, assigned_by)
roles >---< permissions           (role_permissions: role_id, permission_id)
roles >---< permission_groups     (role_permission_groups: role_id, group_id)
permission_groups >---< permissions (permission_group_items: group_id, permission_id)

permissions
  id, key ('resource:action'), resource, action, description

refresh_tokens
  id, user_id (FK), token_hash (unique, sha256), device, expires_at, revoked
```

## Relationships summary

- One **consultancy** organization owns the platform; clients are separate organizations.
- Every `user` belongs to exactly one `organization` (its home tenant).
- A user may have **many roles** within an organization; each role aggregates **permissions**
  directly and via **permission groups**.
- **Multi-tenant isolation** is enforced by `organization_id` on every query (repository + route guards).
