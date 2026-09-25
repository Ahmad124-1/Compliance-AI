import { pool } from '../apps/api/src/db/pool.js';

const res = await pool.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('sync_jobs', 'sync_activity_log', 'sync_propagation') ORDER BY tablename`
);
console.log('SYNC_TABLES:', JSON.stringify(res.rows));

const cols = await pool.query(
  `SELECT table_name, column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name IN ('sync_jobs', 'sync_activity_log', 'sync_propagation')
   ORDER BY table_name, ordinal_position`
);
console.log('SYNC_COLUMNS:', JSON.stringify(cols.rows));

const idx = await pool.query(
  `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('sync_jobs', 'sync_activity_log', 'sync_propagation') ORDER BY indexname`
);
console.log('SYNC_INDEXES:', JSON.stringify(idx.rows));

const m = await pool.query(`SELECT name FROM _migrations ORDER BY name`);
const last = m.rows.slice(-3);
console.log('LAST_MIGRATIONS:', JSON.stringify(last));
console.log('HAS_0031:', m.rows.some((r) => r.name.includes('0031_sprint43_sync_engine')));

await pool.end();