import { migrate } from '../apps/api/src/db/migrate.js';
import { pool } from '../apps/api/src/db/pool.js';

try {
  await migrate();
} finally {
  await pool.end();
}