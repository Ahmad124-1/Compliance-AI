-- =============================================================================
-- 0020 - Sustainability Module
-- Reordered so every referenced object exists before it is referenced.
--
-- Dependency resolution performed:
--   1. sustainability_initiatives moved BEFORE sustainability_kpis
--      (sustainability_kpis.initiative_id FK references it).
--   2. documents table created BEFORE sustainability_evidence
--      (sustainability_evidence.document_id FK references documents(id);
--       no prior migration creates this table).
--   3. All base tables (organizations, users, departments, sites) come from
--      migration 0001_multi_tenant_core.sql and are guaranteed to exist.
--
-- No circular dependencies exist between tables in this module; the
-- initiative/kpi case was a forward reference, resolved by ordering.
-- All statements are idempotent (IF NOT EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. sustainability_programs
--    Depends on: organizations, users, departments (migration 0001)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_programs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
  budget NUMERIC(14,2),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  linked_standards JSONB NOT NULL DEFAULT '[]',
  linked_sdgs INTEGER[] NOT NULL DEFAULT '{}',
  linked_esg_pillars TEXT[] NOT NULL DEFAULT '{}',
  evidence_count INT NOT NULL DEFAULT 0,
  attachment_count INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_programs_org ON sustainability_programs(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_programs_status ON sustainability_programs(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_programs_category ON sustainability_programs(organization_id, category) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 2. esg_goals
--    Depends on: organizations, users (migration 0001), sustainability_programs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS esg_goals (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES sustainability_programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  esg_pillar TEXT NOT NULL CHECK (esg_pillar IN ('environment','social','governance')),
  baseline NUMERIC(14,4),
  target_value NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT '%',
  current_value NUMERIC(14,4),
  deadline DATE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','at_risk','achieved','paused','archived')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  linked_sdgs INTEGER[] NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_goals_org ON esg_goals(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_goals_pillar ON esg_goals(organization_id, esg_pillar) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_goals_status ON esg_goals(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_goals_program ON esg_goals(program_id) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 3. sustainability_initiatives
--    Depends on: organizations, users (migration 0001), sustainability_programs
--    NOTE: Moved BEFORE sustainability_kpis so that the FK from
--          sustainability_kpis.initiative_id resolves correctly.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_initiatives (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES sustainability_programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team TEXT NOT NULL DEFAULT '',
  start_date DATE,
  due_date DATE,
  budget NUMERIC(14,2),
  expected_impact TEXT,
  actual_impact TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled','archived')),
  milestones_count INT NOT NULL DEFAULT 0,
  evidence_count INT NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  linked_sdgs INTEGER[] NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_org ON sustainability_initiatives(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_program ON sustainability_initiatives(program_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_status ON sustainability_initiatives(organization_id, status) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 4. sustainability_kpis
--    Depends on: organizations, users, departments, sites (migration 0001),
--                sustainability_programs, esg_goals, sustainability_initiatives
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_kpis (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES sustainability_programs(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES esg_goals(id) ON DELETE SET NULL,
  initiative_id UUID REFERENCES sustainability_initiatives(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  kpi_type TEXT NOT NULL CHECK (kpi_type IN ('numeric','percentage','ratio','currency','intensity','count','boolean')),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  unit TEXT NOT NULL DEFAULT '',
  target_value NUMERIC(14,4),
  baseline_value NUMERIC(14,4),
  threshold_warning NUMERIC(14,4),
  threshold_critical NUMERIC(14,4),
  aggregation TEXT NOT NULL DEFAULT 'latest' CHECK (aggregation IN ('latest','sum','avg','min','max','count')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_kpis_org ON sustainability_kpis(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_kpis_program ON sustainability_kpis(program_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_kpis_goal ON sustainability_kpis(goal_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_kpis_initiative ON sustainability_kpis(initiative_id) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 5. kpi_measurements
--    Depends on: organizations, users, departments, sites (migration 0001),
--                sustainability_kpis
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_measurements (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES sustainability_kpis(id) ON DELETE CASCADE,
  value NUMERIC(14,4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  notes TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_measurements_kpi ON kpi_measurements(kpi_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_org ON kpi_measurements(organization_id, recorded_at DESC);

-- -----------------------------------------------------------------------------
-- 6. initiative_milestones
--    Depends on: organizations, users (migration 0001), sustainability_initiatives
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS initiative_milestones (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  initiative_id UUID NOT NULL REFERENCES sustainability_initiatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue','cancelled')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  evidence_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_initiative_milestones_initiative ON initiative_milestones(initiative_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_initiative_milestones_org ON initiative_milestones(organization_id) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 7. sdg_mappings
--    Depends on: organizations (migration 0001)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sdg_mappings (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sdg_id INTEGER NOT NULL CHECK (sdg_id BETWEEN 1 AND 17),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('program','goal','initiative','kpi')),
  entity_id UUID NOT NULL,
  contribution_pct NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (contribution_pct >= 0 AND contribution_pct <= 100),
  description TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sdg_id, entity_type, entity_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_sdg_mappings_org ON sdg_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_sdg_mappings_entity ON sdg_mappings(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- 8. documents
--    Depends on: organizations, users (migration 0001)
--    Missing dependency: sustainability_evidence references documents(id), but
--    no prior migration creates this table. It is defined here (before
--    sustainability_evidence) with the schema matching the application's
--    DocumentRecord contract. IF NOT EXISTS keeps this idempotent for any
--    environment where the table was created out-of-band.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  extracted_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','failed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);

-- -----------------------------------------------------------------------------
-- 9. sustainability_evidence
--    Depends on: organizations, users (migration 0001), documents
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_evidence (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('program','goal','kpi','initiative','milestone','report')),
  entity_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('policy','invoice','utility_bill','audit_report','certificate','photo','training_record','contract','esg_evidence','other')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE,
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','submitted','under_review','approved','rejected','archived')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_extracted_data JSONB NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_evidence_org ON sustainability_evidence(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_evidence_entity ON sustainability_evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_evidence_expiry ON sustainability_evidence(organization_id, expiry_date) WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------------
-- 10. sustainability_approvals
--     Depends on: organizations, users (migration 0001)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_approvals (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('goal','kpi','initiative','evidence','report','program')),
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','archived')),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  comments TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_approvals_org ON sustainability_approvals(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_approvals_entity ON sustainability_approvals(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- 11. sustainability_reports
--     Depends on: organizations, users (migration 0001), sustainability_programs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sustainability_reports (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES sustainability_programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('progress','goal_status','sdg_contribution','kpi_performance','initiative_status','executive_summary')),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','xlsx','docx')),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','archived')),
  file_url TEXT,
  summary TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_reports_org ON sustainability_reports(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sustainability_reports_program ON sustainability_reports(program_id) WHERE is_deleted = FALSE;