import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { pool, query } from './pool.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

/**
 * Naive ordered migration runner. Tracks applied files in _migrations.
 */
export async function migrate(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await query<{ name: string }>('SELECT name FROM _migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrate] applying ${file}`);
    await query('BEGIN');
    try {
      await query(sql);
      await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      console.error(`[migrate] failed ${file}`, err);
      throw err;
    }
  }
  console.log('[migrate] done');
}

// Allow running directly: tsx src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
