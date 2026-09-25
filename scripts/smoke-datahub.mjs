import {
  DataHubServiceInstance,
  ReferenceDataServiceInstance,
  DocumentServiceInstance,
  ImportServiceInstance,
  ValidationServiceInstance,
  ActivityServiceInstance,
  PropagationServiceInstance,
  ReportAggregationServiceInstance,
  AIExtractionServiceInstance,
} from '../apps/api/src/services/data-hub.service.js';
import { pool } from '../apps/api/src/db/pool.js';

let USER = '00000000-0000-0000-0000-000000000000';

let ORG = '00000000-0000-0000-0000-000000000000';

async function main() {
  const results = [];

  // Use a real org UUID if one exists (org id column is UUID type)
  const orgResult = await pool.query(`SELECT id FROM organizations ORDER BY created_at LIMIT 1`);
  if (orgResult.rows.length > 0) {
    ORG = String(orgResult.rows[0].id);
  }
  console.log(`[smoke] using org: ${ORG}`);

  // Use a real user UUID (created_by column is UUID type)
  const userResult = await pool.query(`SELECT id FROM users ORDER BY created_at LIMIT 1`);
  if (userResult.rows.length > 0) {
    USER = String(userResult.rows[0].id);
  } else {
    USER = ORG; // fall back to org uuid so casts succeed
  }
  console.log(`[smoke] using user: ${USER}`);

  // 1. Dashboard
  const dashboard = await DataHubServiceInstance.getDashboard(ORG);
  results.push(['dashboard', 'ok', typeof dashboard === 'object']);

  // 2. Master data
  const master = await ReferenceDataServiceInstance.getMasterData(ORG);
  results.push(['master-data', 'ok', typeof master === 'object' && Array.isArray(master.facilities) && Array.isArray(master.sites) && Array.isArray(master.suppliers) && Array.isArray(master.standards)]);

  // 3. Statistics
  const stats = await DataHubServiceInstance.getStatistics(ORG);
  results.push(['statistics', 'ok', typeof stats === 'object']);

  // 4. Queue
  const queue = await DataHubServiceInstance.getQueue(ORG);
  results.push(['queue', 'ok', typeof queue === 'object']);

  // 5. Activity
  const activity = await ActivityServiceInstance.list(ORG, 50);
  results.push(['activity', 'ok', Array.isArray(activity)]);

  // 6. Documents
  const docs = await DocumentServiceInstance.list(ORG);
  results.push(['documents', 'ok', Array.isArray(docs)]);

  // 7. Validation
  const validation = await ValidationServiceInstance.list(ORG, 'pending');
  results.push(['validation', 'ok', Array.isArray(validation)]);

  // 8. AI capabilities (interface only)
  const caps = await AIExtractionServiceInstance.getCapabilities();
  results.push(['ai-capabilities', 'ok', Array.isArray(caps) && caps.length === 0]);

  // 9. Report aggregation dimensions
  const dims = await ReportAggregationServiceInstance.getAvailableDimensions(ORG);
  results.push(['report-dimensions', 'ok', typeof dims === 'object']);

  // 10. Propagation synchronize (no-op target - should not throw)
  const sync = await PropagationServiceInstance.synchronize(ORG, USER, 'facility', '00000000-0000-0000-0000-000000000000', 'Smoke Test Facility');
  results.push(['propagation', 'ok', typeof sync === 'object']);

  // 11. Import job lifecycle (create → preview → commit)
  const job = await ImportServiceInstance.createImportJob(ORG, USER, {
    importType: 'csv',
    entityType: 'facility',
    fileName: 'smoke-test.csv',
    records: [{ name: 'Smoke Facility' }],
    metadata: { source: 'smoke-test' },
  });
  results.push(['import-create', 'ok', job.id !== undefined]);

  const preview = await ImportServiceInstance.preview(ORG, job.id);
  results.push(['import-preview', 'ok', typeof preview === 'object']);

  const committed = await ImportServiceInstance.commitJob(ORG, USER, job.id, {});
  results.push(['import-commit', 'ok', committed.status === 'committed']);

  // 12. Validation review on the committed records
  const pendingItems = await ValidationServiceInstance.list(ORG, 'pending');
  if (pendingItems.length > 0) {
    const first = pendingItems[0];
    const reviewed = await ValidationServiceInstance.review(ORG, USER, first.id, 'approve', {});
    results.push(['validation-review', 'ok', reviewed.status === 'approved']);
  } else {
    results.push(['validation-review', 'ok', true]);
  }

  // Print results
  let allPass = true;
  for (const [name, status, pass] of results) {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: ${status}`);
    if (!pass) allPass = false;
  }
  console.log(allPass ? 'SMOKE_TEST: ALL_PASS' : 'SMOKE_TEST: FAILURES');
  process.exitCode = allPass ? 0 : 1;
}

main()
  .catch((err) => {
    console.error('SMOKE_TEST: ERROR', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });