-- 0002_standards_frameworks.sql
-- Sustainability Standards & Framework engine.

-- A Standard is a published body of requirements (e.g. ISO 14001, GRI, SA8000).
-- Multiple framework versions can exist per standard.
CREATE TABLE standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,            -- e.g. 'ISO14001'
  description TEXT,
  publisher TEXT,                        -- e.g. 'ISO', 'GRI', 'Custom'
  category TEXT,                         -- 'quality' | 'environment' | 'social' | 'energy' | 'esg' | 'custom'
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A framework version is a concrete, adoptable instance of a standard.
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
  version TEXT NOT NULL,                 -- e.g. '2015'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | published | deprecated
  published_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (standard_id, version)
);

-- Category grouping (e.g. 'Environmental Aspects', 'Labour'). Optional hierarchy.
CREATE TABLE framework_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES framework_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (framework_id, code)
);

-- Clause = structural node of the framework (clause tree). Can nest via parent_id.
CREATE TABLE clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES framework_categories(id) ON DELETE SET NULL,
  code TEXT,                              -- e.g. '4.2'
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (framework_id, code)
);

-- Requirement = actionable compliance obligation (leaf expectation).
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES clauses(id) ON DELETE SET NULL,
  category_id UUID REFERENCES framework_categories(id) ON DELETE SET NULL,
  code TEXT,                              -- e.g. '4.2.1'
  title TEXT NOT NULL,
  description TEXT,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (framework_id, code)
);

-- Control = recommended implementation control mapped to a requirement.
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  control_type TEXT,                      -- preventive | detective | corrective
  position INT NOT NULL DEFAULT 0
);

-- Organization's adoption of a framework version.
CREATE TABLE organization_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  adopted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  adopted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (organization_id, framework_id)
);

-- Scope assignments: which sites / departments the framework applies to.
CREATE TABLE framework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_framework_id UUID NOT NULL REFERENCES organization_frameworks(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,                    -- 'site' | 'department' | 'organization'
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_framework_id, scope, site_id, department_id)
);

-- Applicability: per-requirement applicability for an org framework (can exclude).
CREATE TABLE requirement_applicability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_framework_id UUID NOT NULL REFERENCES organization_frameworks(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  applicable BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  UNIQUE (organization_framework_id, requirement_id)
);

-- Control status / implementation state per org framework.
CREATE TABLE control_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_framework_id UUID NOT NULL REFERENCES organization_frameworks(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | implemented | not_applicable
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_framework_id, control_id)
);

-- Requirement-level compliance status (derived-ish, stored for history/audit).
CREATE TABLE compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_framework_id UUID NOT NULL REFERENCES organization_frameworks(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | in_progress | compliant | not_applicable
  progress INT NOT NULL DEFAULT 0,           -- 0..100
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_framework_id, requirement_id)
);

CREATE INDEX idx_frameworks_standard ON frameworks(standard_id);
CREATE INDEX idx_clauses_framework ON clauses(framework_id);
CREATE INDEX idx_clauses_parent ON clauses(parent_id);
CREATE INDEX idx_requirements_framework ON requirements(framework_id);
CREATE INDEX idx_requirements_clause ON requirements(clause_id);
CREATE INDEX idx_controls_requirement ON controls(requirement_id);
CREATE INDEX idx_org_frameworks_org ON organization_frameworks(organization_id);
CREATE INDEX idx_org_frameworks_fw ON organization_frameworks(framework_id);
CREATE INDEX idx_fw_assignments_of ON framework_assignments(organization_framework_id);
CREATE INDEX idx_compliance_status_of ON compliance_status(organization_framework_id);
CREATE INDEX idx_control_status_of ON control_status(organization_framework_id);
