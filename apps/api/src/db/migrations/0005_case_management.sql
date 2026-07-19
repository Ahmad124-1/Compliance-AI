-- 0005_case_management.sql
-- Enterprise Case Management & Investigation Workspace.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core case table. Every grievance becomes a case.
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grievance_id UUID REFERENCES grievances(id) ON DELETE SET NULL,
  case_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | under_investigation | escalated | pending_review | resolved | closed | archived
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  reporter_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  factory_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  country TEXT,
  assigned_to UUID[] DEFAULT '{}',
  labels TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  merged_into UUID REFERENCES cases(id) ON DELETE SET NULL,
  duplicate_of UUID REFERENCES cases(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cases_org_number ON cases(organization_id, case_number);
CREATE INDEX idx_cases_org ON cases(organization_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_factory ON cases(factory_id);
CREATE INDEX idx_cases_department ON cases(department_id);
CREATE INDEX idx_cases_due_date ON cases(due_date);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- Investigations linked to cases.
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  lead_investigator UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | completed | suspended
  scope TEXT,
  methodology TEXT,
  findings_summary TEXT,
  conclusion TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigations_case ON investigations(case_id);
CREATE INDEX idx_investigations_lead ON investigations(lead_investigator);

-- Investigator profiles.
CREATE TABLE investigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  badge_number TEXT,
  specialization TEXT,
  clearance_level TEXT DEFAULT 'standard', -- standard | elevated | top_secret
  active_cases INTEGER NOT NULL DEFAULT 0,
  completed_cases INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_investigators_user ON investigators(user_id);
CREATE INDEX idx_investigators_org ON investigators(organization_id);

-- Investigation assignments (many-to-many with extra fields).
CREATE TABLE investigation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  investigator_id UUID NOT NULL REFERENCES investigators(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'investigator', -- lead | investigator | reviewer | observer
  notes TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  UNIQUE (investigation_id, investigator_id)
);

CREATE INDEX idx_investigation_assignments_investigation ON investigation_assignments(investigation_id);
CREATE INDEX idx_investigation_assignments_investigator ON investigation_assignments(investigator_id);

-- Investigation timeline (chronological events).
CREATE TABLE investigation_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created | updated | assigned | interview_scheduled | interview_completed | evidence_added | finding_added | root_cause_identified | resolution_proposed | case_closed | case_reopened | escalated | comment_added | status_changed
  entity_type TEXT, -- case | investigation | evidence | witness | interview | finding | root_cause | resolution | comment
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigation_timeline_investigation ON investigation_timeline(investigation_id, created_at DESC);
CREATE INDEX idx_investigation_timeline_actor ON investigation_timeline(actor_id);

-- General case activity log.
CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- created | updated | assigned | status_changed | priority_changed | merged | archived | restored | deleted | bulk_operation
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_activities_case ON case_activities(case_id, created_at DESC);
CREATE INDEX idx_case_activities_actor ON case_activities(actor_id);

-- Comments on cases.
CREATE TABLE case_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES case_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  mentions UUID[] DEFAULT '{}',
  attachments UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_comments_case ON case_comments(case_id, created_at DESC);
CREATE INDEX idx_case_comments_author ON case_comments(author_id);
CREATE INDEX idx_case_comments_parent ON case_comments(parent_id);

-- Internal notes (private, not visible to complainants).
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  attachments UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_notes_case ON internal_notes(case_id, created_at DESC);
CREATE INDEX idx_internal_notes_author ON internal_notes(author_id);

-- Public responses (visible to complainant).
CREATE TABLE public_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  attachments UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_responses_case ON public_responses(case_id, created_at DESC);
CREATE INDEX idx_public_responses_author ON public_responses(author_id);

-- Case status history.
CREATE TABLE case_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_status_history_case ON case_status_history(case_id, created_at DESC);
CREATE INDEX idx_case_status_history_changed_by ON case_status_history(changed_by);

-- Evidence files.
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  category TEXT, -- image | document | video | audio | other
  tags TEXT[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  parent_evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_case ON evidence(case_id, created_at DESC);
CREATE INDEX idx_evidence_uploaded_by ON evidence(uploaded_by);
CREATE INDEX idx_evidence_category ON evidence(category);

-- Witnesses.
CREATE TABLE witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- witness | victim | bystander | expert
  statement TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  protection_level TEXT DEFAULT 'standard', -- standard | elevated | protected
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_witnesses_case ON witnesses(case_id);

-- Interviews.
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  witness_id UUID REFERENCES witnesses(id) ON DELETE SET NULL,
  interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'verbal', -- verbal | written | video | audio | forensic
  location TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  summary TEXT NOT NULL,
  transcript TEXT,
  recording_path TEXT,
  findings TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interviews_case ON interviews(case_id, created_at DESC);
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX idx_interviews_witness ON interviews(witness_id);

-- Investigation findings.
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  confidence TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | confirmed
  evidence_ids UUID[] DEFAULT '{}',
  is_final BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_case ON findings(case_id);
CREATE INDEX idx_findings_investigation ON findings(investigation_id);
CREATE INDEX idx_findings_author ON findings(author_id);

-- Root cause analysis.
CREATE TABLE root_causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- people | process | technology | environment | policy | training
  description TEXT NOT NULL,
  contributing_factors TEXT[] DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_root_causes_case ON root_causes(case_id);
CREATE INDEX idx_root_causes_investigation ON root_causes(investigation_id);

-- Resolutions.
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- corrective | disciplinary | policy_change | training | compensation | warning | termination | other
  description TEXT NOT NULL,
  actions_taken TEXT NOT NULL,
  preventive_measures TEXT,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  implemented_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_final BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resolutions_case ON resolutions(case_id);
CREATE INDEX idx_resolutions_investigation ON resolutions(investigation_id);

-- Corrective action placeholders (CAPA integration point).
CREATE TABLE corrective_action_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  resolution_id UUID REFERENCES resolutions(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open', -- open | in_progress | completed | overdue
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corrective_action_placeholders_case ON corrective_action_placeholders(case_id);
CREATE INDEX idx_corrective_action_placeholders_assigned ON corrective_action_placeholders(assigned_to);

-- Escalation rules.
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL, -- time_sla | priority | severity | category | factory | department
  condition_value TEXT NOT NULL,
  escalate_to_role TEXT NOT NULL,
  escalate_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_channel TEXT DEFAULT 'email', -- email | in_app | both
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalation_rules_org ON escalation_rules(organization_id);

-- Escalation history.
CREATE TABLE escalation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES escalation_rules(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_assignee UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalation_history_case ON escalation_history(case_id, created_at DESC);

-- Case tags (many-to-many with extra fields).
CREATE TABLE case_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  color TEXT DEFAULT '#2563eb',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, tag)
);

CREATE INDEX idx_case_tags_case ON case_tags(case_id);
CREATE INDEX idx_case_tags_tag ON case_tags(tag);

-- Case labels (similar to tags but more structured).
CREATE TABLE case_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, label)
);

CREATE INDEX idx_case_labels_case ON case_labels(case_id);
CREATE INDEX idx_case_labels_label ON case_labels(label);

-- Priority matrix rules.
CREATE TABLE priority_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_priority_matrices_org ON priority_matrices(organization_id);

-- Risk scores for cases.
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  calculation_method TEXT DEFAULT 'automated', -- automated | manual | hybrid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_scores_case ON risk_scores(case_id);
CREATE INDEX idx_risk_scores_score ON risk_scores(overall_score);

-- Case linking (related cases).
CREATE TABLE case_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  related_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related', -- related | duplicate | parent | child | follow_up
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, related_case_id, link_type)
);

CREATE INDEX idx_case_links_case ON case_links(case_id);
CREATE INDEX idx_case_links_related ON case_links(related_case_id);

-- Saved filters for case list.
CREATE TABLE saved_case_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_case_filters_org ON saved_case_filters(organization_id);
CREATE INDEX idx_saved_case_filters_user ON saved_case_filters(user_id);

-- Case watchers (users watching a case for updates).
CREATE TABLE case_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, user_id)
);

CREATE INDEX idx_case_watchers_case ON case_watchers(case_id);
CREATE INDEX idx_case_watchers_user ON case_watchers(user_id);
