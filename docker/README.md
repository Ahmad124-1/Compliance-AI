# docker

Container build and orchestration assets for ComplianceOS AI.

## Images

- `Dockerfile.web` — multi-stage Next.js build for `apps/web`.
- `Dockerfile.api` — multi-stage Node build for `apps/api`.

## Local stack

`docker-compose.yml` provisions three services:

| Service | Image            | Port  | Notes                       |
| ------- | ---------------- | ----- | --------------------------- |
| `db`    | postgres:16      | 5432  | persistent volume `db_data` |
| `api`   | built from `.`   | 4000  | waits for healthy `db`      |
| `web`   | built from `.`   | 3000  | depends on `api`            |

### Quickstart

```bash
cp .env.example .env   # fill in AUTH_SECRET at minimum
docker compose up -d
docker compose logs -f web
```

### Tear down

```bash
docker compose down -v   # include -v to drop the database volume
```
