-- =====================================================================
-- PHASE 3: DATA HUB (SUSTAINABILITY WORKSPACE)
-- Centralized single source of truth for the application.
-- This migration ONLY adds NEW bridge/mapping/sync structures.
-- It does NOT modify, drop, or rename any existing tables/columns.
-- =====================================================================

CREATE TABLE IF NOT EXISTS data_hub_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  total_records INTEGER NOT NULL DEFAULT 0,
  valid_records INTEGER NOT NULL DEFAULT 0,
  invalid_records INTEGER NOT NULL DEFAULT 0,
  error_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_hub_import_jobs_org ON data_hub_import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_jobs_status ON data_hub_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_jobs_entity ON data_hub_import_jobs(entity_type);

CREATE TABLE IF NOT EXISTS data_hub_validation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_job_id UUID REFERENCES data_hub_import_jobs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_name TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  propagated_to JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_hub_validation_org ON data_hub_validation_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_validation_status ON data_hub_validation_queue(status);
CREATE INDEX IF NOT EXISTS idx_data_hub_validation_entity ON data_hub_validation_queue(entity_type);
CREATE INDEX IF NOT EXISTS idx_data_hub_validation_job ON data_hub_validation_queue(import_job_id);

CREATE TABLE IF NOT EXISTS data_hub_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_hub_activity_org ON data_hub_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_activity_created ON data_hub_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_hub_activity_action ON data_hub_activity_log(action);

CREATE TABLE IF NOT EXISTS data_hub_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES worker_documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  link_type TEXT NOT NULL DEFAULT 'reference',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_hub_doc_links_org ON data_hub_document_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_doc_links_doc ON data_hub_document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_doc_links_entity ON data_hub_document_links(entity_type, entity_id);
