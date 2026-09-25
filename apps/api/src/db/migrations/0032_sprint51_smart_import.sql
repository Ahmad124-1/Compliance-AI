-- PHASE 5.1 SMART DATA COLLECTION & INGESTION
-- Additive only. Extends existing tables. Adds 4 lightweight tables.

ALTER TABLE data_hub_import_jobs
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS file_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duplicate_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation_report JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE data_hub_validation_queue
  ADD COLUMN IF NOT EXISTS row_number INTEGER,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID,
  ADD COLUMN IF NOT EXISTS duplicate_action TEXT,
  ADD COLUMN IF NOT EXISTS duplicate_confidence NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_row JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS data_hub_import_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_job_id UUID NOT NULL REFERENCES data_hub_import_jobs(id) ON DELETE CASCADE,
  source_column TEXT NOT NULL,
  target_field TEXT,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_auto_mapped BOOLEAN NOT NULL DEFAULT TRUE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  data_type TEXT NOT NULL DEFAULT 'string',
  sample_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_columns_org ON data_hub_import_columns(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_columns_job ON data_hub_import_columns(import_job_id);

CREATE TABLE IF NOT EXISTS data_hub_import_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_job_id UUID NOT NULL REFERENCES data_hub_import_jobs(id) ON DELETE CASCADE,
  validation_queue_id UUID REFERENCES data_hub_validation_queue(id) ON DELETE CASCADE,
  duplicate_of_validation_queue_id UUID REFERENCES data_hub_validation_queue(id) ON DELETE CASCADE,
  duplicate_key TEXT NOT NULL,
  duplicate_type TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  action TEXT NOT NULL DEFAULT 'skip',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_dups_org ON data_hub_import_duplicates(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_dups_job ON data_hub_import_duplicates(import_job_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_dups_key ON data_hub_import_duplicates(import_job_id, duplicate_key);

CREATE TABLE IF NOT EXISTS data_hub_import_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_job_id UUID NOT NULL REFERENCES data_hub_import_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  processed INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_progress_org ON data_hub_import_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_progress_job ON data_hub_import_progress(import_job_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_import_progress_stage ON data_hub_import_progress(import_job_id, stage);

CREATE TABLE IF NOT EXISTS data_hub_document_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES worker_documents(id) ON DELETE CASCADE,
  classification TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'heuristic',
  classified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  classified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_hub_doc_class_org ON data_hub_document_classifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_doc_class_doc ON data_hub_document_classifications(document_id);
CREATE INDEX IF NOT EXISTS idx_data_hub_doc_class_type ON data_hub_document_classifications(classification);