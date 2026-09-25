-- =====================================================================
-- PHASE 4 — SPRINT 4.1: MASTER DATA SYNCHRONIZATION
-- Backward compatible. Reuses all existing tables.
-- Adds a single lightweight sync-status tracking table only.
-- =====================================================================

-- Sync status per entity so GET /sync/status has persisted state.
CREATE TABLE IF NOT EXISTS data_hub_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_by UUID REFERENCES users(id) ON DELETE SET NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  sync_mode TEXT NOT NULL DEFAULT 'api',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_data_hub_sync_status_org_entity
  ON data_hub_sync_status(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_data_hub_sync_status_org
  ON data_hub_sync_status(organization_id);