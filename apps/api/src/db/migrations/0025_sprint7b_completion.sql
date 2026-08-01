-- 0025_sprint7b_completion.sql
-- Completes Sprint 7B: SBTi targets, new emission sources, department analytics, carbon settings

-- ============================================================
-- 1. SBTi Targets Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sbti_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  scope_id UUID REFERENCES ghg_scopes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('near_term','long_term','net_zero')),
  target_category TEXT NOT NULL DEFAULT 'absolute' CHECK (target_category IN ('absolute','intensity','renewable_energy','supplier_engagement','other')),
  base_year INTEGER NOT NULL,
  target_year INTEGER NOT NULL,
  base_year_emissions_tco2e NUMERIC(14,4) NOT NULL,
  target_emissions_tco2e NUMERIC(14,4) NOT NULL,
  current_emissions_tco2e NUMERIC(14,4),
  reduction_pct NUMERIC(5,2) NOT NULL,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  scope_coverage TEXT NOT NULL DEFAULT 'scope1_scope2' CHECK (scope_coverage IN ('scope1','scope2','scope3','scope1_scope2','scope1_scope2_scope3')),
  pathway_type TEXT NOT NULL DEFAULT 'linear' CHECK (pathway_type IN ('linear','s_curve','exponential','custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','validating','validated','active','at_risk','missed','achieved','archived')),
  validation_body TEXT,
  validation_date DATE,
  validation_document_url TEXT,
  milestones JSONB NOT NULL DEFAULT '[]',
  achieved_early BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbti_targets_org ON sbti_targets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sbti_targets_type ON sbti_targets(target_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sbti_targets_status ON sbti_targets(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sbti_targets_year ON sbti_targets(target_year) WHERE is_deleted = FALSE;

-- ============================================================
-- 2. SBTi Target Milestones Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sbti_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sbti_target_id UUID NOT NULL REFERENCES sbti_targets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  milestone_year INTEGER NOT NULL,
  target_emissions_tco2e NUMERIC(14,4) NOT NULL,
  current_emissions_tco2e NUMERIC(14,4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','on_track','at_risk','missed','achieved')),
  achieved_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbti_milestones_target ON sbti_milestones(sbti_target_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 3. Carbon Settings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS carbon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  default_unit TEXT NOT NULL DEFAULT 'metric_tonnes',
  mass_unit TEXT NOT NULL DEFAULT 'tonnes' CHECK (mass_unit IN ('kg','tonnes','metric_tonnes')),
  energy_unit TEXT NOT NULL DEFAULT 'kwh' CHECK (energy_unit IN ('kwh','mwh','mj','gj')),
  volume_unit TEXT NOT NULL DEFAULT 'liters' CHECK (volume_unit IN ('liters','gallons','cubic_meters')),
  distance_unit TEXT NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km','miles')),
  reporting_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (reporting_frequency IN ('monthly','quarterly','yearly')),
  default_report_format TEXT NOT NULL DEFAULT 'pdf' CHECK (default_report_format IN ('pdf','xlsx','csv')),
  default_report_type TEXT NOT NULL DEFAULT 'carbon_inventory' CHECK (default_report_type IN ('carbon_inventory','ghg_inventory','executive_report','facility_report','sbti_report')),
  auto_calculate_emissions BOOLEAN NOT NULL DEFAULT TRUE,
  enable_ai_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  enable_sbti_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  default_base_year INTEGER,
  approval_workflow TEXT NOT NULL DEFAULT 'single' CHECK (approval_workflow IN ('none','single','dual','chain')),
  currency TEXT NOT NULL DEFAULT 'USD',
  carbon_cost_per_tonne NUMERIC(14,2),
  logo_url TEXT,
  brand_color TEXT DEFAULT '#059669',
  report_footer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ============================================================
-- 4. Add Missing Emission Source Types to CHECK constraint
-- NOTE: We need to alter the emission_sources table to allow new types.
-- Since CHECK constraints can't be altered directly, we'll create
-- a new constraint and drop the old one.
-- ============================================================
ALTER TABLE emission_sources DROP CONSTRAINT IF EXISTS emission_sources_source_type_check;
ALTER TABLE emission_sources ADD CONSTRAINT emission_sources_source_type_check
  CHECK (source_type IN (
    'diesel','petrol','natural_gas','coal','generators','company_vehicles',
    'electricity','steam','purchased_cooling','water','waste',
    'flights','hotels','commute','freight','shipping',
    'raw_materials','packaging','suppliers','refrigerants','industrial','custom',
    'lpg','purchased_heat','purchased_steam','purchased_energy','biomass','solar_pv','wind'
  ));

-- ============================================================
-- 5. Add department_id to emission_records for department analytics
-- ============================================================
ALTER TABLE emission_records ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emission_records_dept ON emission_records(organization_id, department_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 6. Carbon Reports - add generated data and schedule support
-- ============================================================
ALTER TABLE carbon_reports ADD COLUMN IF NOT EXISTS schedule TEXT CHECK (schedule IN ('none','daily','weekly','monthly','quarterly','yearly'));
ALTER TABLE carbon_reports ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;
ALTER TABLE carbon_reports ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMPTZ;
ALTER TABLE carbon_reports ADD COLUMN IF NOT EXISTS chart_data JSONB DEFAULT '{}';
ALTER TABLE carbon_reports ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

