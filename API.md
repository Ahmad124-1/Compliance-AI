# API — ComplianceOS AI (Sprint 1)

Base URL: `http://localhost:4000`. All bodies JSON. Authenticated routes require
`Authorization: Bearer <accessToken>`.

## Auth (`/api/v1/auth`)

| Method | Path | Auth | Body | Notes |
| ------ | ---- | ---- | ---- | ----- |
| POST | `/register` | — | `{ email, password, firstName?, lastName?, organizationName }` | Creates client org + owner |
| POST | `/login` | — | `{ email, password }` | Returns session (access+refresh) |
| POST | `/refresh` | refresh | `{ refreshToken }` | Rotates refresh token |
| POST | `/logout` | — | `{ refreshToken? }` | Revokes refresh |
| POST | `/forgot-password` | — | `{ email }` | Triggers reset token |
| POST | `/reset-password` | — | `{ token, password }` | |
| POST | `/change-password` | ✓ | `{ currentPassword, newPassword }` | |
| POST | `/verify-email` | — | `{ token }` | |
| GET  | `/me` | ✓ | — | Returns claims |

### Session shape
```json
{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900,
  "user": { "id": "...", "email": "...", "status": "active" },
  "organization": { "id": "...", "name": "..." },
  "roles": ["owner"], "permissions": ["org:read", "user:invite"] }
```

## Users (`/api/v1/users`, org-scoped) — perm-guarded
`GET /`, `GET /:id`, `POST /invite` (`user:invite`), `POST /:id/activate`,
`POST /:id/disable`, `PATCH /:id/profile`, `POST|DELETE /:id/roles/:roleId`.

## Organizations (`/api/v1/organizations`) — `org:*`
`GET /`, `GET /:id`, `POST /` (create), `PATCH /:id`, `DELETE /:id`.

## Tenants (`/api/v1/tenants`) — `site:*`, `department:*`, `team:*`
Sites: `GET /sites`, `POST /sites`, `PATCH /sites/:id`.
Departments: `GET /departments`, `POST /departments`, `PATCH /departments/:id`.
Teams: `GET /teams`, `POST /teams`, `PATCH /teams/:id`.

## RBAC (`/api/v1/rbac`) — `permission:*`, `role:*`
`GET /permissions`, `GET /permission-groups` (+ `POST`, `POST /:groupId/permissions/:pid`),
`GET /roles`, `POST /roles`, `GET /roles/:roleId/permissions`,
`POST /roles/:roleId/permissions/:pid`, `POST /roles/:roleId/groups/:groupId`.

## Permission model

Permissions use `resource:action` keys: `org`, `site`, `department`, `team`, `user`, `role`,
`permission`, `profile` × `read|create|update|delete|assign|invite`. Roles aggregate permissions
directly or through permission groups. A user's effective permissions = union of all their roles'
permissions, embedded in the JWT.

## Errors

```json
{ "error": "UNAUTHORIZED", "message": "Invalid credentials" }
```
HTTP status reflects the error (`400` validation, `401` auth, `403` forbidden, `404` not found,
`409` conflict, `500` internal).
