-- 0008_assessment_framework_engine.sql
-- Sprint 4A: Assessment Framework Engine & Dynamic Checklist Builder.
--
-- This migration introduces the full assessment template/checklist builder,
-- conditional logic, scoring + validation engines, framework/control mapping,
-- and the run-time Assessment (instance) + response model.
--
-- Conventions (per DATABASE.md):
--   * UUID PKs via gen_random_uuid()
--   * Every tenant-scoped table carries organization_id (FK organizations ON DELETE CASCADE)
--   * JSONB for flexible config (conditions, scoring rules, validation, scoring config)
--   * created_at / updated_at timestamps
--   * Soft archive via archived_at / is_archived (no hard deletes of templates)

-- ============================================================================
-- ENUMS (as CHECK constraints to stay portable)
-- ============================================================================

-- Assessment lifecycle status.
CREATE TYPE assessment_status AS ENUM (
  'draft', 'in_progress', 'submitted', 'under_review', 'approved',
  'rejected', 'completed', 'cancelled', 'archived'
);

-- Assessment instance kinds.
CREATE TYPE assessment_type AS ENUM (
  'internal', 'supplier', 'factory', 'self', 'customer',
  'pre_audit', 'follow_up', 'custom'
);

-- Assignment / delegation status.
CREATE TYPE assessment_assignment_status AS ENUM (
  'assigned', 'accepted', 'in_progress', 'completed', 'declined', 'expired'
);

-- Review / approval decision.
CREATE TYPE assessment_review_decision AS ENUM (
  'pending', 'approved', 'rejected', 'needs_changes'
);

-- Assessment comment visibility / kind.
CREATE TYPE assessment_comment_kind AS ENUM (
  'general', 'question', 'section', 'review', 'system'
);

-- ============================================================================
-- LOOKUP / CATALOGUE TABLES (tenant-scoped where relevant)
-- ============================================================================

-- Answer type catalogue (short_text, long_text, number, ...).
CREATE TABLE assessment_answer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,                        -- 'short_text' | 'number' | 'yes_no' ...
  label TEXT NOT NULL,
  description TEXT,
  has_options BOOLEAN NOT NULL DEFAULT FALSE,
  supports_validation BOOLEAN NOT NULL DEFAULT TRUE,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

-- Assessment categories (tenant catalogue, e.g. 'Health & Safety', 'Labour').
CREATE TABLE assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  color TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

-- Free-form + structured tags (tenant-scoped).
CREATE TABLE assessment_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- Assessment types catalogue (tenant-scoped override of the enum set).
CREATE TABLE assessment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type assessment_type NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  default_scoring_method TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, type)
);

-- ============================================================================
-- TEMPLATE (the reusable blueprint)
-- ============================================================================

CREATE TABLE assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type assessment_type NOT NULL DEFAULT 'internal',
  category_id UUID REFERENCES assessment_categories(id) ON DELETE SET NULL,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',      -- draft | published | archived
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_template_id UUID REFERENCES assessment_templates(id) ON DELETE SET NULL,
  latest_version_id UUID REFERENCES assessment_templates(id) ON DELETE SET NULL,
  default_language TEXT NOT NULL DEFAULT 'en',
  estimated_duration_minutes INT,
  instructions TEXT,
  scoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_templates_org ON assessment_templates(organization_id);
CREATE INDEX idx_assessment_templates_status ON assessment_templates(status);
CREATE INDEX idx_assessment_templates_type ON assessment_templates(type);
CREATE INDEX idx_assessment_templates_category ON assessment_templates(category_id);
CREATE INDEX idx_assessment_templates_parent ON assessment_templates(parent_template_id);
CREATE INDEX idx_assessment_templates_latest ON assessment_templates(latest_version_id);

-- Version history is captured by versioned template rows sharing latest_version_id.
CREATE TABLE assessment_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  version INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  change_summary TEXT,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

CREATE INDEX idx_assessment_template_versions_tpl ON assessment_template_versions(template_id);

-- ============================================================================
-- TEMPLATE STRUCTURE: sections, questions, options, conditions, dependencies
-- ============================================================================

CREATE TABLE assessment_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  parent_section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT,
  guidance TEXT,
  position INT NOT NULL DEFAULT 0,
  weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  collapse_by_default BOOLEAN NOT NULL DEFAULT FALSE,
  conditional_logic JSONB,
  visibility_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_sections_tpl ON assessment_sections(template_id);
CREATE INDEX idx_assessment_sections_parent ON assessment_sections(parent_section_id);

CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  parent_question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  group_id UUID,
  code TEXT,
  label TEXT NOT NULL,
  help_text TEXT,
  answer_type_id UUID REFERENCES assessment_answer_types(id) ON DELETE SET NULL,
  answer_type_key TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  allows_multiple BOOLEAN NOT NULL DEFAULT FALSE,
  max_selections INT,
  scoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditional_logic JSONB,
  visibility_rules JSONB,
  dependency_rules JSONB,
  framework_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  control_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_questions_tpl ON assessment_questions(template_id);
CREATE INDEX idx_assessment_questions_section ON assessment_questions(section_id);
CREATE INDEX idx_assessment_questions_parent ON assessment_questions(parent_question_id);
CREATE INDEX idx_assessment_questions_group ON assessment_questions(group_id);

CREATE TABLE assessment_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  score NUMERIC(8,4) DEFAULT 0,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  conditional_logic JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_assessment_question_options_q ON assessment_question_options(question_id);

-- Reusable conditional logic definitions (IF/ELSE/AND/OR, nested).
CREATE TABLE assessment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES assessment_templates(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  logic JSONB NOT NULL,                        -- structured condition tree
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_conditions_org ON assessment_conditions(organization_id);
CREATE INDEX idx_assessment_conditions_tpl ON assessment_conditions(template_id);

-- Explicit question dependency graph (a depends on b given condition).
CREATE TABLE assessment_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  depends_on_question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'requires_answer', -- requires_answer | requires_value | requires_option | blocks_when
  condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, depends_on_question_id, dependency_type)
);

CREATE INDEX idx_assessment_dependencies_tpl ON assessment_dependencies(template_id);
CREATE INDEX idx_assessment_dependencies_q ON assessment_dependencies(question_id);

-- ============================================================================
-- SCORING + VALIDATION RULES (template-level reusable definitions)
-- ============================================================================

CREATE TABLE assessment_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL,                        -- pass_fail | percentage | weighted | risk | compliance | manual | automatic
  scope TEXT NOT NULL DEFAULT 'question',       -- question | section | overall
  target_id UUID,                              -- question_id or section_id (NULL = overall)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  applies_when JSONB,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_scoring_rules_org ON assessment_scoring_rules(organization_id);
CREATE INDEX idx_assessment_scoring_rules_tpl ON assessment_scoring_rules(template_id);

CREATE TABLE assessment_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  name TEXT,
  rule_type TEXT NOT NULL,                     -- required | range | pattern | file | answer | custom | conditional
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'error',       -- error | warning
  applies_when JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_validation_rules_org ON assessment_validation_rules(organization_id);
CREATE INDEX idx_assessment_validation_rules_tpl ON assessment_validation_rules(template_id);
CREATE INDEX idx_assessment_validation_rules_q ON assessment_validation_rules(question_id);

-- ============================================================================
-- FRAMEWORK + CONTROL MAPPING (catalogue reuse from standards engine)
-- ============================================================================

CREATE TABLE assessment_framework_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,                      -- SMETA | SA8000 | ISO 9001 | ...
  framework_id UUID REFERENCES frameworks(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  control_id UUID REFERENCES controls(id) ON DELETE SET NULL,
  clause_code TEXT,
  mapping_strength TEXT NOT NULL DEFAULT 'direct', -- direct | partial | indirect
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, question_id, framework, requirement_id)
);

CREATE INDEX idx_assessment_fw_mappings_org ON assessment_framework_mappings(organization_id);
CREATE INDEX idx_assessment_fw_mappings_tpl ON assessment_framework_mappings(template_id);
CREATE INDEX idx_assessment_fw_mappings_q ON assessment_framework_mappings(question_id);
CREATE INDEX idx_assessment_fw_mappings_fw ON assessment_framework_mappings(framework);
CREATE INDEX idx_assessment_fw_mappings_req ON assessment_framework_mappings(requirement_id);

CREATE TABLE assessment_control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  control_source TEXT NOT NULL,                -- existing_control | internal_standard | customer_code
  control_id UUID,
  control_code TEXT,
  control_title TEXT,
  mapping_strength TEXT NOT NULL DEFAULT 'direct',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, question_id, control_source, control_id)
);

CREATE INDEX idx_assessment_ctl_mappings_org ON assessment_control_mappings(organization_id);
CREATE INDEX idx_assessment_ctl_mappings_tpl ON assessment_control_mappings(template_id);
CREATE INDEX idx_assessment_ctl_mappings_q ON assessment_control_mappings(question_id);

-- ============================================================================
-- ASSESSMENT INSTANCE (run-time execution shell — not the responses themselves)
-- ============================================================================

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE RESTRICT,
  template_version INT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  type assessment_type NOT NULL DEFAULT 'internal',
  category_id UUID REFERENCES assessment_categories(id) ON DELETE SET NULL,
  status assessment_status NOT NULL DEFAULT 'draft',
  scope TEXT NOT NULL DEFAULT 'organization',   -- organization | site | department | team | worker
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_start_date TIMESTAMPTZ,
  scheduled_end_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  scoring_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_assessments_template ON assessments(template_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_assignee ON assessments(assignee_id);
CREATE INDEX idx_assessments_site ON assessments(site_id);
CREATE INDEX idx_assessments_department ON assessments(department_id);

-- Per-assessment scoring snapshots per scope.
CREATE TABLE assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  raw_value NUMERIC(12,4),
  normalized_score NUMERIC(8,4),               -- 0..100
  weighted_score NUMERIC(10,4),
  max_score NUMERIC(10,4),
  label TEXT,
  passed BOOLEAN,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, question_id, section_id, method)
);

CREATE INDEX idx_assessment_scores_assessment ON assessment_scores(assessment_id);
CREATE INDEX idx_assessment_scores_q ON assessment_scores(question_id);
CREATE INDEX idx_assessment_scores_section ON assessment_scores(section_id);

-- Answers / responses (one row per question per assessment).
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answer_text TEXT,
  answer_number NUMERIC(14,4),
  answer_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_option_ids UUID[],
  selected_values TEXT[],
  is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  confidence NUMERIC(3,2),
  validation_status TEXT NOT NULL DEFAULT 'pending', -- pending | valid | invalid
  validation_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_q ON assessment_responses(question_id);
CREATE INDEX idx_assessment_responses_section ON assessment_responses(section_id);

-- ============================================================================
-- WORKFLOW: assignments, reviews, approvals, comments, attachments
-- ============================================================================

CREATE TABLE assessment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignee_role TEXT,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status assessment_assignment_status NOT NULL DEFAULT 'assigned',
  scope TEXT NOT NULL DEFAULT 'assessment',     -- assessment | section | question
  target_id UUID,
  due_date TIMESTAMPTZ,
  instructions TEXT,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_assignments_org ON assessment_assignments(organization_id);
CREATE INDEX idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX idx_assessment_assignments_assignee ON assessment_assignments(assignee_id);

CREATE TABLE assessment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  decision assessment_review_decision NOT NULL DEFAULT 'pending',
  scope TEXT NOT NULL DEFAULT 'overall',        -- overall | section | question
  target_id UUID,
  summary TEXT,
  score_override NUMERIC(8,4),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_reviews_org ON assessment_reviews(organization_id);
CREATE INDEX idx_assessment_reviews_assessment ON assessment_reviews(assessment_id);
CREATE INDEX idx_assessment_reviews_reviewer ON assessment_reviews(reviewer_id);

CREATE TABLE assessment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  level INT NOT NULL DEFAULT 1,
  decision assessment_review_decision NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_approvals_org ON assessment_approvals(organization_id);
CREATE INDEX idx_assessment_approvals_assessment ON assessment_approvals(assessment_id);
CREATE INDEX idx_assessment_approvals_approver ON assessment_approvals(approver_id);

CREATE TABLE assessment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  kind assessment_comment_kind NOT NULL DEFAULT 'general',
  scope TEXT NOT NULL DEFAULT 'assessment',     -- assessment | section | question
  target_id UUID,
  body TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  parent_comment_id UUID REFERENCES assessment_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_comments_org ON assessment_comments(organization_id);
CREATE INDEX idx_assessment_comments_assessment ON assessment_comments(assessment_id);
CREATE INDEX idx_assessment_comments_parent ON assessment_comments(parent_comment_id);

CREATE TABLE assessment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  assessment_response_id UUID REFERENCES assessment_responses(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_key TEXT NOT NULL,
  url TEXT,
  kind TEXT NOT NULL DEFAULT 'file',            -- file | image | video | audio | signature
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_attachments_org ON assessment_attachments(organization_id);
CREATE INDEX idx_assessment_attachments_assessment ON assessment_attachments(assessment_id);
CREATE INDEX idx_assessment_attachments_response ON assessment_attachments(assessment_response_id);

-- ============================================================================
-- SCHEDULE PLACEHOLDERS (reusable cadence templates — not actual scheduling)
-- ============================================================================

CREATE TABLE assessment_schedule_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES assessment_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',    -- daily | weekly | monthly | quarterly | yearly | adhoc
  interval_count INT NOT NULL DEFAULT 1,
  anchor_day INT,
  anchor_month INT,
  scope TEXT NOT NULL DEFAULT 'organization',
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  default_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_schedule_ph_org ON assessment_schedule_placeholders(organization_id);
CREATE INDEX idx_assessment_schedule_ph_tpl ON assessment_schedule_placeholders(template_id);

-- ============================================================================
-- TRIGGERS: keep updated_at fresh
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_templates_updated BEFORE UPDATE ON assessment_templates
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_sections_updated BEFORE UPDATE ON assessment_sections
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_questions_updated BEFORE UPDATE ON assessment_questions
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_conditions_updated BEFORE UPDATE ON assessment_conditions
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_scoring_rules_updated BEFORE UPDATE ON assessment_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_validation_rules_updated BEFORE UPDATE ON assessment_validation_rules
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_categories_updated BEFORE UPDATE ON assessment_categories
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_types_updated BEFORE UPDATE ON assessment_types
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_answer_types_updated BEFORE UPDATE ON assessment_answer_types
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessments_updated BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_scores_updated BEFORE UPDATE ON assessment_scores
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_responses_updated BEFORE UPDATE ON assessment_responses
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_assignments_updated BEFORE UPDATE ON assessment_assignments
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_reviews_updated BEFORE UPDATE ON assessment_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_approvals_updated BEFORE UPDATE ON assessment_approvals
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_comments_updated BEFORE UPDATE ON assessment_comments
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER assessment_schedule_placeholders_updated BEFORE UPDATE ON assessment_schedule_placeholders
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
