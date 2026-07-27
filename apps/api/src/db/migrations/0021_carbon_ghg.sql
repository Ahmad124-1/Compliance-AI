CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('factory','plant','warehouse','head_office','regional_office','distribution_center')),
  address JSONB NOT NULL DEFAULT '{}',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_org ON facilities(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(organization_id, facility_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS emission_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_category TEXT NOT NULL,
  source_type TEXT NOT NULL,
  scope_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emission_sources_org ON emission_sources(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_sources_scope ON emission_sources(scope_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS ghg_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope_number INTEGER NOT NULL CHECK (scope_number IN (1,2,3)),
  description TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, scope_number) WHERE is_deleted = FALSE
);

CREATE INDEX IF NOT EXISTS idx_ghg_scopes_org ON ghg_scopes(organization_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS emission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  emission_source_id UUID REFERENCES emission_sources(id) ON DELETE SET NULL,
  scope_id UUID REFERENCES ghg_scopes(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL DEFAULT '{}',
  co2e NUMERIC(14,4) NOT NULL,
  co2 NUMERIC(14,4),
  ch4 NUMERIC(14,4),
  n2o NUMERIC(14,4),
  hfc NUMERIC(14,4),
  pfc NUMERIC(14,4),
  sf6 NUMERIC(14,4),
  unit TEXT NOT NULL,
  emission_date DATE NOT NULL,
  reporting_period TEXT NOT NULL,
  calculation_method TEXT NOT NULL DEFAULT 'standard',
  emission_factor_id UUID,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emission_records_org ON emission_records(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_records_source ON emission_records(emission_source_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_records_scope ON emission_records(scope_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_records_period ON emission_records(organization_id, reporting_period) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_records_date ON emission_records(organization_id, emission_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  factor_type TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  value NUMERIC(14,8) NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  geography TEXT,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emission_factors_org ON emission_factors(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_factors_type ON emission_factors(factor_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_factors_category ON emission_factors(category) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emission_factors_effective ON emission_factors(effective_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS carbon_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN ('solar_installation','led_replacement','ev_fleet','water_conservation','waste_reduction','recycling','process_optimization','energy_efficiency','renewable_energy','other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','approved','in_progress','completed','cancelled','on_hold')),
  budget NUMERIC(14,2),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  expected_reduction_tco2e NUMERIC(14,4),
  actual_reduction_tco2e NUMERIC(14,4),
  roi NUMERIC(8,2),
  evidence TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carbon_projects_org ON carbon_projects(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_carbon_projects_status ON carbon_projects(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_carbon_projects_type ON carbon_projects(project_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS carbon_offsets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES carbon_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  offset_type TEXT NOT NULL CHECK (offset_type IN ('carbon_credit','verified_carbon','gold_standard','other')),
  registry TEXT,
  registry_id TEXT,
  credits_purchased NUMERIC(14,4) NOT NULL,
  credits_retired NUMERIC(14,4) NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  cost_per_ton NUMERIC(14,2),
  total_cost NUMERIC(14,2),
  certificate_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carbon_offsets_org ON carbon_offsets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_carbon_offsets_project ON carbon_offsets(project_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS reduction_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  scope_id UUID REFERENCES ghg_scopes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('net_zero','annual','department','facility','scope','reduction_plan')),
  baseline_emissions_tco2e NUMERIC(14,4) NOT NULL,
  target_emissions_tco2e NUMERIC(14,4) NOT NULL,
  baseline_year INTEGER NOT NULL,
  target_year INTEGER NOT NULL,
  current_emissions_tco2e NUMERIC(14,4),
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','at_risk','achieved','missed','paused','archived')),
  milestones JSONB NOT NULL DEFAULT '[]',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reduction_targets_org ON reduction_targets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_reduction_targets_type ON reduction_targets(target_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_reduction_targets_status ON reduction_targets(organization_id, status) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS carbon_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('carbon_inventory','ghg_inventory','emission_summary','scope_report','facility_report','project_report','reduction_report','executive_report','cdp_report','sbti_report')),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','xlsx','csv')),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','archived')),
  file_url TEXT,
  summary TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carbon_reports_org ON carbon_reports(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_carbon_reports_type ON carbon_reports(report_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  emission_record_id UUID REFERENCES emission_records(id) ON DELETE SET NULL,
  calculation_type TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  emission_factor_id UUID REFERENCES emission_factors(id) ON DELETE SET NULL,
  result_co2e NUMERIC(14,4) NOT NULL,
  result_breakdown JSONB NOT NULL DEFAULT '{}',
  methodology TEXT NOT NULL,
  calculated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculation_history_org ON calculation_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_calculation_history_record ON calculation_history(emission_record_id);
