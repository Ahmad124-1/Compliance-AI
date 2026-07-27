CREATE TABLE IF NOT EXISTS water_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ground_water','municipal','rainwater','recycled','surface_water','other')),
  consumption_date DATE NOT NULL,
  consumption_amount NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm3',
  discharge_amount NUMERIC(14,4),
  discharge_quality TEXT,
  treatment_method TEXT,
  reuse_amount NUMERIC(14,4) DEFAULT 0,
  leak_detected BOOLEAN NOT NULL DEFAULT FALSE,
  leak_details TEXT,
  water_intensity NUMERIC(14,4),
  cost NUMERIC(14,2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_usage_org ON water_usage(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_water_usage_facility ON water_usage(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_water_usage_date ON water_usage(organization_id, consumption_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_water_usage_source ON water_usage(organization_id, source_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  waste_type TEXT NOT NULL CHECK (waste_type IN ('general','hazardous','electronic','plastic','paper','organic','metal','chemical','medical','construction','other')),
  quantity NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  weight NUMERIC(14,4),
  disposal_method TEXT NOT NULL,
  recycler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  manifest_number TEXT,
  certificate_url TEXT,
  hazardous_details TEXT,
  waste_date DATE NOT NULL,
  cost NUMERIC(14,2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_records_org ON waste_records(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_waste_records_facility ON waste_records(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_waste_records_type ON waste_records(organization_id, waste_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_waste_records_date ON waste_records(organization_id, waste_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS air_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  emission_source_id UUID REFERENCES emission_sources(id) ON DELETE SET NULL,
  emission_type TEXT NOT NULL CHECK (emission_type IN ('stack','boiler','generator','dust','voc','nox','sox','pm25','pm10','co','co2','methane','other')),
  quantity NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  monitoring_frequency TEXT CHECK (monitoring_frequency IN ('continuous','daily','weekly','monthly','quarterly','yearly','other')),
  emission_limit NUMERIC(14,4),
  concentration NUMERIC(14,4),
  emission_date DATE NOT NULL,
  reporting_period TEXT NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_air_emissions_org ON air_emissions(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_air_emissions_facility ON air_emissions(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_air_emissions_type ON air_emissions(organization_id, emission_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_air_emissions_date ON air_emissions(organization_id, emission_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_air_emissions_period ON air_emissions(organization_id, reporting_period) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS chemicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  chemical_name TEXT NOT NULL,
  cas_number TEXT,
  formula TEXT,
  hazard_classification TEXT NOT NULL CHECK (hazard_classification IN ('flammable','toxic','corrosive','explosive','reactive','environmental','carcinogen','mutagen','oxidizer','irritant','other')),
  storage_location TEXT,
  quantity NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expiry_date DATE,
  msds_url TEXT,
  usage_description TEXT,
  risk_rating TEXT CHECK (risk_rating IN ('low','medium','high','extreme')),
  emergency_procedures TEXT,
  ppe_requirements TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','expired')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chemicals_org ON chemicals(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chemicals_facility ON chemicals(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chemicals_hazard ON chemicals(organization_id, hazard_classification) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_chemicals_approval ON chemicals(organization_id, approval_status) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS environmental_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('chemical_spill','water_leak','oil_spill','air_pollution','illegal_disposal','hazardous_release','permit_violation','environmental_complaint','noise_pollution','soil_contamination','other')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','contained','resolved','closed','escalated')),
  incident_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT,
  root_cause TEXT,
  capa_id UUID,
  investigation_status TEXT CHECK (investigation_status IN ('pending','in_progress','completed','not_required')),
  investigation_notes TEXT,
  evidence_urls JSONB NOT NULL DEFAULT '[]',
  timeline JSONB NOT NULL DEFAULT '[]',
  responsible_person_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_date TIMESTAMPTZ,
  resolution_notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_incidents_org ON environmental_incidents(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_incidents_facility ON environmental_incidents(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_incidents_type ON environmental_incidents(organization_id, incident_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_incidents_status ON environmental_incidents(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_incidents_severity ON environmental_incidents(organization_id, severity) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_incidents_date ON environmental_incidents(organization_id, incident_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS environmental_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  aspect TEXT NOT NULL,
  impact TEXT NOT NULL,
  likelihood TEXT NOT NULL CHECK (likelihood IN ('rare','unlikely','possible','likely','almost_certain')),
  severity TEXT NOT NULL CHECK (severity IN ('negligible','minor','moderate','major','severe')),
  risk_score NUMERIC(6,2) NOT NULL,
  controls TEXT,
  mitigation_measures TEXT,
  monitoring_plan TEXT,
  responsible_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_schedule TEXT CHECK (review_schedule IN ('monthly','quarterly','bi_annual','annual','as_needed')),
  last_review_date DATE,
  next_review_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','mitigated','closed','accepted')),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_risks_org ON environmental_risks(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_risks_facility ON environmental_risks(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_risks_score ON environmental_risks(organization_id, risk_score) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_risks_status ON environmental_risks(organization_id, status) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  permit_type TEXT NOT NULL CHECK (permit_type IN ('water','air','waste','chemical','environmental_approval','discharge','emission','storage','transport','other')),
  permit_number TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending','revoked','suspended','renewed')),
  conditions TEXT,
  supporting_documents JSONB NOT NULL DEFAULT '[]',
  approval_history JSONB NOT NULL DEFAULT '[]',
  responsible_person_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permits_org ON permits(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_permits_facility ON permits(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_permits_type ON permits(organization_id, permit_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_permits_expiry ON permits(expiry_date) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('electricity','gas','fuel','steam','compressed_air','water','other')),
  consumption_amount NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL,
  cost NUMERIC(14,2),
  consumption_date DATE NOT NULL,
  reporting_period TEXT NOT NULL,
  efficiency_rating NUMERIC(5,2),
  intensity_metric NUMERIC(14,4),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_usage_org ON resource_usage(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_resource_usage_facility ON resource_usage(facility_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_resource_usage_type ON resource_usage(organization_id, resource_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_resource_usage_date ON resource_usage(organization_id, consumption_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_resource_usage_period ON resource_usage(organization_id, reporting_period) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS environmental_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN ('protected_area','tree_plantation','green_area','wildlife','habitat_protection','restoration','environmental_initiative','other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','approved','in_progress','completed','cancelled','on_hold')),
  budget NUMERIC(14,2),
  actual_cost NUMERIC(14,2),
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  area_covered NUMERIC(14,2),
  trees_planted INTEGER,
  evidence_urls JSONB NOT NULL DEFAULT '[]',
  progress_notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_projects_org ON environmental_projects(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_projects_type ON environmental_projects(organization_id, project_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_env_projects_status ON environmental_projects(organization_id, status) WHERE is_deleted = FALSE;
