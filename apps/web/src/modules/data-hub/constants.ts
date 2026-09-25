export const DATA_HUB_ENDPOINTS = {
dashboard: '/api/v1/data-hub/dashboard',
  masterData: '/api/v1/data-hub/master-data',
  import: '/api/v1/data-hub/import',
  importPreview: '/api/v1/data-hub/import/preview',
  importCommit: '/api/v1/data-hub/import/commit',
  importValidate: '/api/v1/data-hub/import/validate',
  importJobs: '/api/v1/data-hub/import/jobs',
  importJob: (id: string) => `/api/v1/data-hub/import/jobs/${id}`,
  importJobRetry: (id: string) => `/api/v1/data-hub/import/jobs/${id}/retry`,
  documents: '/api/v1/data-hub/documents',
  validation: '/api/v1/data-hub/validation',
  activity: '/api/v1/data-hub/activity',
  statistics: '/api/v1/data-hub/statistics',
  queue: '/api/v1/data-hub/queue',
  settings: '/api/v1/data-hub/settings',
  synchronize: '/api/v1/data-hub/settings/synchronize',
};

// Sprint 4.1 — master data synchronization (single source of truth for
// dropdowns across carbon, sustainability, ESG, environment and reports).
export const SYNC_ENDPOINTS = {
  masterData: '/api/v1/sync/master-data',
  status: '/api/v1/sync/status',
  lookup: (entityType: string) => `/api/v1/sync/lookup/${entityType}`,
  entity: (entityType: string) => `/api/v1/sync/${entityType}`,
};

// Sprint 4.3 — synchronization engine (background jobs, activity logging,
// sync status, retry mechanism, conflict detection, duplicate prevention).
export const SYNC_ENGINE_ENDPOINTS = {
  run: '/api/v1/sync/run',
  status: '/api/v1/sync/status',
  logs: '/api/v1/sync/logs',
  retry: '/api/v1/sync/retry',
  documentResolve: '/api/v1/sync/documents/resolve',
  documentLink: '/api/v1/sync/documents/link',
  documents: (entityType: string, entityId?: string) =>
    entityId
      ? `/api/v1/sync/documents?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      : `/api/v1/sync/documents?entityType=${encodeURIComponent(entityType)}`,
};

// Entity types the sync engine can propagate. `all` sweeps every module.
export const SYNC_ENTITY_TYPES = [
  'facility', 'supplier', 'project', 'kpi', 'carbon_record', 'document', 'all',
] as const;

export const HUB_DOCUMENT_CATEGORIES = [
  'Certificate', 'Policy', 'Invoice', 'Utility Bill', 'Gas Bill', 'Electricity Bill',
  'Water Bill', 'Audit Report', 'Training Record', 'Supplier Document',
  'Environmental Report', 'Carbon Report', 'Other',
];

// Standards/frameworks are GLOBAL reference catalogues (migration 0002, no
// organization_id column) — they are shared reference data, not per-org
// import targets. Importable entities are org-scoped tables only.
export const IMPORT_ENTITY_TYPES = [
  'facilities', 'sites', 'departments', 'suppliers', 'programs', 'goals', 'kpis',
  'emission_factors',
];

export const VALIDATION_ACTIONS = ['approve', 'reject', 'edit', 'merge', 'ignore'] as const;
export const IMPORT_STATUSES = ['uploaded', 'queued', 'running', 'completed', 'failed', 'retry', 'cancelled', 'committed'] as const;