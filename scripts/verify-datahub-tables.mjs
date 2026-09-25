import { pool } from '../apps/api/src/db/pool.js';

const res = await pool.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'data_hub%' ORDER BY tablename`
);
console.log('DATA_HUB_TABLES:', JSON.stringify(res.rows));

const m = await pool.query(`SELECT name FROM _migrations ORDER BY name`);
console.log('ALL_MIGRATIONS:', JSON.stringify(m.rows));
console.log('MIGRATION_COUNT:', m.rows.length, 'LAST_5:', JSON.stringify(m.rows.slice(-5)));

await pool.end();