-- 0026_sprint7c_environment.sql
-- Sprint 7C: ISO 14001 Environmental Management System
-- Extends Sprint 7A (Sustainability) and Sprint 7B (Carbon & GHG)

-- ============================================================
-- 1. Water Targets & KPIs
-- ============================================================
CREATE TABLE IF NOT EXISTS water_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('reduction','intensity','reuse','recycling','discharge_quality','other')),
  baseline_value NUMERIC(14,4) NOT NULL,
  target_value NUMERIC(14,4) NOT NULL,
  current_value NUMERIC(14,4),
  unit TEXT NOT NULL DEFAULT 'm3',
  baseline_year INTEGER NOT NULL,
  target_year INTEGER NOT NULL,
  progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','achieved','missed','paused','archived')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_targets_org ON water_targets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_water_targets_facility ON water_targets(facility_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 2. Waste Vendors
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('recycler','disposal','treatment','collection','transport','other')),
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  license_expiry DATE,
  waste_types_accepted TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  contract_start DATE,
  contract_end DATE,
  pricing_notes TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approval_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_vendors_org ON waste_vendors(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_waste_vendors_type ON waste_vendors(vendor_type);

-- ============================================================
-- 3. Waste Targets & KPIs
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  waste_type TEXT NOT NULL CHECK (waste_type IN ('general','hazardous','plastic','paper','metal','electronic','organic','medical','construction','all')),
  target_type TEXT NOT NULL CHECK (target_type IN ('reduction','recycling','diversion','intensity','cost_reduction','other')),
  baseline_value NUMERIC(14,4) NOT NULL,
  target_value NUMERIC(14,4) NOT NULL,
  current_value NUMERIC(14,4),
  unit TEXT NOT NULL DEFAULT 'kg',
  baseline_year INTEGER NOT NULL,
  target_year INTEGER NOT NULL,
  progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','achieved','missed','paused','archived')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_targets_org ON waste_targets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_waste_targets_facility ON waste_targets(facility_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 4. Air Emission Limits (Permit Compliance)
-- ============================================================
CREATE TABLE IF NOT EXISTS air_emission_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  permit_id UUID REFERENCES permits(id) ON DELETE SET NULL,
  emission_type TEXT NOT NULL CHECK (emission_type IN ('pm25','pm10','nox','sox','voc','co','co2','methane','dust','stack','other')),
  limit_value NUMERIC(14,4) NOT NULL,
  limit_unit TEXT NOT NULL DEFAULT 'kg/year',
  monitoring_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (monitoring_frequency IN ('continuous','daily','weekly','monthly','quarterly','yearly')),
  max_concentration NUMERIC(10,4),
  concentration_unit TEXT DEFAULT 'mg/m3',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_air_emission_limits_org ON air_emission_limits(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_air_emission_limits_facility ON air_emission_limits(facility_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 5. Chemical Containers (Container/Storage Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS chemical_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  chemical_id UUID NOT NULL REFERENCES chemicals(id) ON DELETE CASCADE,
  container_type TEXT NOT NULL CHECK (container_type IN ('drum','tote','cylinder','tank','bottle','bag','other')),
  capacity NUMERIC(10,2) NOT NULL,
  capacity_unit TEXT NOT NULL DEFAULT 'liters',
  current_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_unit TEXT NOT NULL DEFAULT 'liters',
  storage_location TEXT,
  storage_area TEXT,
  hazard_classification TEXT,
  status TEXT NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use','empty','stored','disposed','in_transit')),
  fill_date DATE,
  empty_date DATE,
  inspection_frequency TEXT DEFAULT 'monthly',
  last_inspection_date DATE,
  next_inspection_date DATE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chem_containers_org ON chemical_containers(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chem_containers_chemical ON chemical_containers(chemical_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 6. Chemical Spill Records
-- ============================================================
CREATE TABLE IF NOT EXISTS chemical_spill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  chemical_id UUID REFERENCES chemicals(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES environmental_incidents(id) ON DELETE SET NULL,
  spill_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity_spilled NUMERIC(10,2) NOT NULL,
  quantity_unit TEXT NOT NULL DEFAULT 'liters',
  spill_location TEXT NOT NULL,
  spill_cause TEXT,
  containment_action TEXT,
  cleanup_action TEXT,
  cleanup_status TEXT NOT NULL DEFAULT 'pending' CHECK (cleanup_status IN ('pending','in_progress','completed','verified')),
  cleanup_date TIMESTAMPTZ,
  cleaned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  environmental_impact TEXT,
  reportable BOOLEAN NOT NULL DEFAULT FALSE,
  reported_to_authority BOOLEAN NOT NULL DEFAULT FALSE,
  authority_name TEXT,
  authority_reference TEXT,
  costs NUMERIC(14,2),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chem_spills_org ON chemical_spill_records(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chem_spills_incident ON chemical_spill_records(incident_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 7. Biodiversity Records
-- ============================================================
CREATE TABLE IF NOT EXISTS biodiversity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('protected_area','land_usage','tree_plantation','tree_loss','habitat_restoration','species_monitoring','community_project','green_area','other')),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_size NUMERIC(12,2),
  area_unit TEXT DEFAULT 'hectares',
  trees_planted INTEGER DEFAULT 0,
  trees_lost INTEGER DEFAULT 0,
  species_count INTEGER,
  species_list TEXT[] DEFAULT '{}',
  protected_species TEXT[] DEFAULT '{}',
  restoration_area NUMERIC(12,2),
  restoration_status TEXT CHECK (restoration_status IN ('planning','in_progress','completed','monitoring','cancelled')),
  community_participants INTEGER,
  community_partner TEXT,
  funding_amount NUMERIC(14,2),
  funding_source TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','planned')),
  start_date DATE,
  end_date DATE,
  evidence_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biodiversity_org ON biodiversity_records(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_biodiversity_type ON biodiversity_records(record_type);
CREATE INDEX IF NOT EXISTS idx_biodiversity_status ON biodiversity_records(organization_id, status) WHERE is_deleted = FALSE;

-- ============================================================
-- 8. Environmental Objectives (ISO 14001)
-- ============================================================
CREATE TABLE IF NOT EXISTS environmental_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  parent_objective_id UUID REFERENCES environmental_objectives(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  objective_type TEXT NOT NULL CHECK (objective_type IN (
    'waste_reduction','water_reduction','energy_efficiency','emission_reduction',
    'pollution_prevention','recycling','biodiversity','compliance','training',
    'chemical_safety','incident_reduction','other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  baseline_value NUMERIC(14,4),
  target_value NUMERIC(14,4) NOT NULL,
  current_value NUMERIC(14,4),
  unit TEXT,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  completion_date DATE,
  progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('draft','in_progress','achieved','missed','cancelled','on_hold')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  evidence_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_objectives_org ON environmental_objectives(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_objectives_type ON environmental_objectives(organization_id, objective_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_objectives_status ON environmental_objectives(organization_id, status) WHERE is_deleted = FALSE;

-- ============================================================
-- 9. Objective Milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS objective_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES environmental_objectives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(14,4),
  current_value NUMERIC(14,4),
  target_date DATE NOT NULL,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','missed','cancelled')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obj_milestones_objective ON objective_milestones(objective_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 10. Environmental Reports
-- ============================================================
CREATE TABLE IF NOT EXISTS environmental_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'environmental','water','waste','air','chemical','incident',
    'permit','biodiversity','executive','compliance'
  )),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','xlsx','csv','docx')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','archived')),
  file_url TEXT,
  summary TEXT,
  chart_data JSONB DEFAULT '{}',
  params JSONB DEFAULT '{}',
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ,
  schedule TEXT CHECK (schedule IN ('none','daily','weekly','monthly','quarterly','yearly')),
  last_generated_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_reports_org ON environmental_reports(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_reports_type ON environmental_reports(organization_id, report_type) WHERE is_deleted = FALSE;

-- ============================================================
-- 11. Environmental AI Insights Cache
-- ============================================================
CREATE TABLE IF NOT EXISTS environmental_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'risk_detection','compliance_recommendation','waste_reduction',
    'water_optimization','chemical_safety','incident_summary',
    'executive_summary','trend_analysis','anomaly_detection'
  )),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('info','warning','critical','positive')),
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_insights_org ON environmental_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_env_insights_type ON environmental_insights(organization_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_env_insights_severity ON environmental_insights(organization_id, severity);

-- ============================================================
-- 12. Additional Columns for Existing Tables
-- ============================================================

-- Add sustainability linkage to environmental objectives
ALTER TABLE environmental_objectives ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES esg_goals(id) ON DELETE SET NULL;
ALTER TABLE environmental_objectives ADD COLUMN IF NOT EXISTS linked_program_id UUID REFERENCES sustainability_programs(id) ON DELETE SET NULL;

-- Add intensity metrics to water_usage
ALTER TABLE water_usage ADD COLUMN IF NOT EXISTS water_intensity_target NUMERIC(10,4);
ALTER TABLE water_usage ADD COLUMN IF NOT EXISTS water_reuse_target NUMERIC(10,4);

-- Add recycling rate to waste_records
ALTER TABLE waste_records ADD COLUMN IF NOT EXISTS recycling_rate NUMERIC(5,2);
ALTER TABLE waste_records ADD COLUMN IF NOT EXISTS diversion_rate NUMERIC(5,2);

-- Add compliance check fields to air_emissions
ALTER TABLE air_emissions ADD COLUMN IF NOT EXISTS permit_id UUID REFERENCES permits(id) ON DELETE SET NULL;
ALTER TABLE air_emissions ADD COLUMN IF NOT EXISTS limit_exceeded BOOLEAN DEFAULT FALSE;
ALTER TABLE air_emissions ADD COLUMN IF NOT EXISTS compliance_notes TEXT;

-- Add permit linkage to incidents
ALTER TABLE environmental_incidents ADD COLUMN IF NOT EXISTS permit_id UUID REFERENCES permits(id) ON DELETE SET NULL;
ALTER TABLE environmental_incidents ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE environmental_incidents ADD COLUMN IF NOT EXISTS reported_to TEXT;
ALTER TABLE environmental_incidents ADD COLUMN IF NOT EXISTS regulatory_reference TEXT;

-- Add risk level to permits
ALTER TABLE permits ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('low','medium','high','critical'));
ALTER TABLE permits ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS last_renewal_date DATE;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS cost NUMERIC(14,2);

-- ============================================================
-- 13. Environmental KPIs View (for analytics)
-- ============================================================
CREATE OR REPLACE VIEW v_environmental_kpis AS
SELECT
  w.organization_id,
  w.facility_id,
  'water_consumption' AS kpi_type,
  SUM(w.consumption_amount) AS total_value,
  COUNT(*) AS record_count,
  AVG(w.consumption_amount) AS avg_value,
  SUM(w.reuse_amount) AS total_reuse,
  CASE WHEN SUM(w.consumption_amount) > 0 
    THEN (SUM(w.reuse_amount) / SUM(w.consumption_amount)) * 100 
    ELSE 0 END AS reuse_rate,
  DATE_TRUNC('month', w.consumption_date::DATE) AS period
FROM water_usage w
WHERE w.is_deleted = FALSE
GROUP BY w.organization_id, w.facility_id, DATE_TRUNC('month', w.consumption_date::DATE)
UNION ALL
SELECT
  wr.organization_id,
  wr.facility_id,
  'waste_generation' AS kpi_type,
  SUM(wr.quantity) AS total_value,
  COUNT(*) AS record_count,
  AVG(wr.quantity) AS avg_value,
  SUM(CASE WHEN wr.waste_type NOT IN ('hazardous','general') THEN wr.quantity ELSE 0 END) AS total_reuse,
  CASE WHEN SUM(wr.quantity) > 0 
    THEN (SUM(CASE WHEN wr.waste_type NOT IN ('hazardous','general') THEN wr.quantity ELSE 0 END) / SUM(wr.quantity)) * 100 
    ELSE 0 END AS reuse_rate,
  DATE_TRUNC('month', wr.waste_date::DATE) AS period
FROM waste_records wr
WHERE wr.is_deleted = FALSE
GROUP BY wr.organization_id, wr.facility_id, DATE_TRUNC('month', wr.waste_date::DATE)
UNION ALL
SELECT
  ae.organization_id,
  ae.facility_id,
  'air_emissions' AS kpi_type,
  SUM(ae.quantity) AS total_value,
  COUNT(*) AS record_count,
  AVG(ae.quantity) AS avg_value,
  0 AS total_reuse,
  0 AS reuse_rate,
  DATE_TRUNC('month', ae.emission_date::DATE) AS period
FROM air_emissions ae
WHERE ae.is_deleted = FALSE
GROUP BY ae.organization_id, ae.facility_id, DATE_TRUNC('month', ae.emission_date::DATE);

