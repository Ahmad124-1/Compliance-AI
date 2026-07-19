CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  linked_audit_id UUID,
  linked_complaint_id UUID,
  linked_investigation_id UUID,
  linked_standard_id UUID,
  linked_control_id UUID,
  owner_id UUID,
  assigned_to_id UUID,
  risk_rating TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS non_conformities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  finding_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  severity TEXT NOT NULL,
  assigned_to_id UUID,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capas (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  non_conformity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  severity TEXT NOT NULL,
  risk TEXT,
  owner_id UUID,
  team_id UUID,
  due_date TIMESTAMPTZ,
  progress INT NOT NULL DEFAULT 0,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capa_tasks (
  id UUID PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  assigned_to_id UUID,
  due_date TIMESTAMPTZ,
  progress INT NOT NULL DEFAULT 0,
  parent_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS root_causes (
  id UUID PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  corrective_recommendation TEXT,
  preventive_recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  likelihood INT NOT NULL,
  impact INT NOT NULL,
  severity TEXT NOT NULL,
  priority TEXT NOT NULL,
  residual_risk TEXT,
  trend TEXT,
  heatmap_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_checklists (
  id UUID PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capa_approvals (
  id UUID PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL,
  reviewer_id UUID,
  status TEXT NOT NULL,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
