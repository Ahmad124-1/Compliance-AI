import { query } from '../apps/api/src/db/pool.js';

async function main() {
  const t = await query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'data_hub_import_%' ORDER BY tablename",
  );
  console.log('import tables:', t.rows.map((r) => r.tablename).join(', '));

  const c = await query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'data_hub_document_%' ORDER BY tablename",
  );
  console.log('classification tables:', c.rows.map((r) => r.tablename).join(', '));

  // Verify the new columns were added to existing tables.
  const cols = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'data_hub_import_jobs' AND column_name IN
     ('progress','column_mapping','validation_report','file_hash','retry_count')
     ORDER BY column_name`,
  );
  console.log('new import_jobs columns:', cols.rows.map((r) => r.column_name).join(', '));

  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});