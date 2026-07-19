-- 0009_audit_execution_workspace.sql
-- Sprint 4B: Audit Execution Workspace + field execution engine.

CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  template_id UUID REFERENCES assessment_templates(id) ON DELETE SET NULL,
  factory_id UUID,
  supplier_id UUID,
  organization_unit_id UUID,
  auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_start_date TIMESTAMPTZ,
  scheduled_end_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  progress INT NOT NULL DEFAULT 0,
  risk_rating TEXT,
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  source_section_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  progress INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  audit_section_id UUID REFERENCES audit_sections(id) ON DELETE CASCADE,
  question_id UUID,
  source_question_id UUID,
  question_label TEXT NOT NULL,
  answer_type TEXT NOT NULL,
  response_text TEXT,
  response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments TEXT,
  score NUMERIC(8,4),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  observation_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  recommendation TEXT,
  linked_standard_id UUID,
  linked_requirement_id UUID,
  linked_control_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES audit_observations(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  risk_rating TEXT,
  title TEXT NOT NULL,
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  gps_location TEXT,
  observed_at TIMESTAMPTZ,
  file_name TEXT,
  storage_key TEXT,
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL,
  subject_name TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  signer_type TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  calendar_date DATE NOT NULL,
  view_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  reminder_at TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  overall_progress INT NOT NULL DEFAULT 0,
  section_progress INT NOT NULL DEFAULT 0,
  question_progress INT NOT NULL DEFAULT 0,
  completion_percentage INT NOT NULL DEFAULT 0,
  estimated_remaining_minutes INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_org ON audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audit_sections_audit ON audit_sections(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_question_responses_audit ON audit_question_responses(audit_id);
