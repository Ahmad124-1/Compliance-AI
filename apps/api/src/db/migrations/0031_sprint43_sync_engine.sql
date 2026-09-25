-- =====================================================================
-- PHASE 4 — SPRINT 4.3: SYNCHRONIZATION ENGINE
-- Background synchronization jobs, activity logging, retry mechanism,
-- conflict detection, and duplicate prevention.
--
-- Backward compatible. Reuses all existing tables (facilities, suppliers,
-- carbon_projects, sustainability_kpis, emission_records, worker_documents,
-- data_hub_activity_log, data_hub_sync_status, data_hub_document_links).
-- Adds three lightweight tables only:
--   1. sync_jobs          — background synchronization job registry
--   2. sync_activity_log  — sync-specific activity/audit trail
--   3. sync_propagation   — conflict detection + duplicate prevention ledger
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. sync_jobs — background sync job registry
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,                -- 'manual' | 'background' | 'retry'
  entity_type TEXT NOT NULL,             -- 'facility' | 'supplier' | 'project' | 'kpi' | 'carbon_record' | 'document' | 'all'
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed','skipped','conflict')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_org ON sync_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_entity ON sync_jobs(organization_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created ON sync_jobs(created_at DESC);

-- ---------------------------------------------------------------------
-- 2. sync_activity_log — sync-specific activity/audit trail
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                  -- 'sync.triggered' | 'sync.completed' | 'sync.failed' | 'sync.retried' | 'sync.propagated' | 'sync.skipped' | 'sync.conflict'
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  source_module TEXT,
  target_module TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','skipped','conflict')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_activity_org ON sync_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_activity_created ON sync_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_activity_job ON sync_activity_log(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_activity_action ON sync_activity_log(action);

-- ---------------------------------------------------------------------
-- 3. sync_propagation — conflict detection + duplicate prevention ledger
-- ---------------------------------------------------------------------
-- Guards every entity-type → module propagation edge. A unique constraint
-- on (organization_id, entity_type, entity_id, source_module, target_module)
-- prevents duplicate updates. A hash comparison skips no-op re-syncs.
-- If target_updated_at is newer than source_updated_at, the edge is
-- recorded as a conflict and propagation is skipped (never clobbers).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_propagation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  source_module TEXT NOT NULL,           -- 'administration' | 'compliance' | 'supplier' | 'sustainability' | 'carbon' | 'esg' | 'environment'
  target_module TEXT NOT NULL,           -- 'sustainability' | 'esg' | 'environment' | 'dashboards' | 'reports' | 'compliancedocs'
  source_updated_at TIMESTAMPTZ,
  target_updated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_status TEXT NOT NULL DEFAULT 'synced' CHECK (last_status IN ('synced','skipped','conflict')),
  conflict_reason TEXT,
  content_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sync_propagation_edge
  ON sync_propagation(organization_id, entity_type, entity_id, source_module, target_module);
CREATE INDEX IF NOT EXISTS idx_sync_propagation_org ON sync_propagation(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_propagation_status ON sync_propagation(organization_id, last_status);
CREATE INDEX IF NOT EXISTS idx_sync_propagation_entity ON sync_propagation(organization_id, entity_type, entity_id);

-- ---------------------------------------------------------------------
-- Seed known sync job runs so GET /sync/run has no empty-state surprise;
-- per-org rows are created lazily when an organization actually syncs.
-- No data seed is required — all rows are organization-scoped and created
-- on demand. This migration only creates schema.
-- ---------------------------------------------------------------------