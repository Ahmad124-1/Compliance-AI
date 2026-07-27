CREATE TABLE IF NOT EXISTS esg_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  framework_code TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'latest',
  issuing_body TEXT,
  effective_date DATE,
  categories JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_frameworks_org ON esg_frameworks(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_frameworks_code ON esg_frameworks(organization_id, framework_code) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES esg_frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  metric_code TEXT NOT NULL,
  category TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('environmental','social','governance')),
  unit TEXT,
  data_type TEXT NOT NULL CHECK (data_type IN ('numeric','percentage','currency','boolean','text','date','json')),
  reporting_frequency TEXT NOT NULL CHECK (reporting_frequency IN ('monthly','quarterly','semi_annual','annual','event_based','continuous')),
  applicable_facilities UUID[] DEFAULT '{}',
  applicable_departments UUID[] DEFAULT '{}',
  calculation_method TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  target_value NUMERIC,
  baseline_value NUMERIC,
  evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
  verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_metrics_org ON esg_metrics(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_metrics_framework ON esg_metrics(organization_id, framework_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_metrics_pillar ON esg_metrics(organization_id, pillar) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_metrics_category ON esg_metrics(organization_id, category) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_reporting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly','quarterly','semi_annual','annual','custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','open','closed','extended','finalized')),
  frameworks UUID[] DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_reporting_periods_org ON esg_reporting_periods(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_reporting_periods_status ON esg_reporting_periods(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_reporting_periods_dates ON esg_reporting_periods(organization_id, start_date, end_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES esg_metrics(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES esg_reporting_periods(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  value NUMERIC NOT NULL,
  value_text TEXT,
  value_json JSONB,
  unit TEXT,
  confidence_score NUMERIC(5,2),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  source_system TEXT,
  source_reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_data_points_org ON esg_data_points(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_data_points_metric ON esg_data_points(organization_id, metric_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_data_points_period ON esg_data_points(organization_id, period_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_data_points_verified ON esg_data_points(organization_id, is_verified) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_materiality_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('environmental','social','governance')),
  external_drivers JSONB NOT NULL DEFAULT '[]',
  internal_drivers JSONB NOT NULL DEFAULT '[]',
  stakeholder_groups TEXT[] DEFAULT '{}',
  impact_score NUMERIC(5,2),
  likelihood_score NUMERIC(5,2),
  financial_impact TEXT CHECK (financial_impact IN ('high','medium','low','negligible')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_materiality_topics_org ON esg_materiality_topics(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_materiality_topics_pillar ON esg_materiality_topics(organization_id, pillar) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_materiality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES esg_materiality_topics(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES esg_reporting_periods(id) ON DELETE CASCADE,
  impact_score NUMERIC(5,2) NOT NULL,
  likelihood_score NUMERIC(5,2) NOT NULL,
  stakeholder_priority NUMERIC(5,2),
  financial_materiality BOOLEAN NOT NULL DEFAULT FALSE,
  impact_materiality BOOLEAN NOT NULL DEFAULT FALSE,
  overall_priority_score NUMERIC(5,2),
  justification TEXT,
  assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_materiality_assessments_org ON esg_materiality_assessments(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_materiality_assessments_period ON esg_materiality_assessments(organization_id, period_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES esg_frameworks(id) ON DELETE SET NULL,
  metric_id UUID REFERENCES esg_metrics(id) ON DELETE SET NULL,
  period_id UUID NOT NULL REFERENCES esg_reporting_periods(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('environmental','social','governance')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','rejected','published','archived')),
  content JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  page_reference TEXT,
  linked_documents UUID[] DEFAULT '{}',
  data_points UUID[] DEFAULT '{}',
  assurance_status TEXT NOT NULL DEFAULT 'not_started' CHECK (assurance_status IN ('not_started','in_progress','completed','failed')),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_disclosures_org ON esg_disclosures(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_disclosures_period ON esg_disclosures(organization_id, period_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_disclosures_status ON esg_disclosures(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_disclosures_pillar ON esg_disclosures(organization_id, pillar) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES esg_reporting_periods(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('comprehensive','sustainability','climate','social','governance','regulatory_filing','executive_summary','stakeholder','custom')),
  format TEXT NOT NULL CHECK (format IN ('pdf','xlsx','docx','json','html')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','completed','approved','published','archived','failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  pages_count INTEGER,
  summary TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_reports_org ON esg_reports(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_reports_period ON esg_reports(organization_id, period_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_reports_status ON esg_reports(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_reports_type ON esg_reports(organization_id, report_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS esg_assurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id UUID REFERENCES esg_reports(id) ON DELETE CASCADE,
  disclosure_id UUID REFERENCES esg_disclosures(id) ON DELETE CASCADE,
  assurance_type TEXT NOT NULL CHECK (assurance_type IN ('internal','external','limited','reasonable','peer_review','third_party')),
  scope_description TEXT NOT NULL,
  provider_name TEXT,
  provider_email TEXT,
  assurance_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','failed','cancelled')),
  findings JSONB NOT NULL DEFAULT '[]',
  conclusion TEXT,
  opinion_type TEXT CHECK (opinion_type IN ('clean','qualified','adverse','disclaimer','not_applicable')),
  evidence_references UUID[] DEFAULT '{}',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esg_assurance_org ON esg_assurance(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_assurance_report ON esg_assurance(organization_id, report_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_esg_assurance_status ON esg_assurance(organization_id, status) WHERE is_deleted = FALSE;
