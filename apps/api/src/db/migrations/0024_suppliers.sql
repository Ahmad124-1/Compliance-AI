CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category TEXT,
  industry TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  address JSONB,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  tax_id TEXT,
  registration_number TEXT,
  business_unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  esg_score NUMERIC DEFAULT 0,
  carbon_score NUMERIC DEFAULT 0,
  compliance_rate NUMERIC DEFAULT 0,
  total_assessments INT DEFAULT 0,
  active_audits INT DEFAULT 0,
  open_corrective_actions INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(organization_id, country) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_suppliers_risk ON suppliers(organization_id, risk_level) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(organization_id, category) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(organization_id, status) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('factory', 'warehouse', 'production_site', 'office', 'distribution_center', 'other')),
  address JSONB,
  city TEXT,
  region TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_facilities_supplier ON supplier_facilities(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_facilities_org ON supplier_facilities(organization_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance', 'health_safety', 'ethics', 'responsible_sourcing', 'labor_rights', 'human_rights', 'anti_corruption', 'data_privacy')),
  questions JSONB DEFAULT '[]',
  evidence JSONB DEFAULT '[]',
  scoring JSONB DEFAULT '{}',
  overall_score NUMERIC DEFAULT 0,
  environmental_score NUMERIC DEFAULT 0,
  social_score NUMERIC DEFAULT 0,
  governance_score NUMERIC DEFAULT 0,
  health_safety_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
  reviewer_id UUID,
  reviewer_name TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'requested_changes')),
  approved_by_id UUID,
  approved_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_assessments_supplier ON supplier_assessments(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_org ON supplier_assessments(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_category ON supplier_assessments(organization_id, category) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_status ON supplier_assessments(organization_id, status) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  overall_esg_score NUMERIC DEFAULT 0,
  environmental_score NUMERIC DEFAULT 0,
  social_score NUMERIC DEFAULT 0,
  governance_score NUMERIC DEFAULT 0,
  compliance_score NUMERIC DEFAULT 0,
  carbon_score NUMERIC DEFAULT 0,
  risk_score NUMERIC DEFAULT 0,
  benchmark_comparison JSONB DEFAULT '{}',
  trend_analysis JSONB DEFAULT '[]',
  historical_performance JSONB DEFAULT '[]',
  assessment_period TEXT,
  scoring_date TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_scorecards_supplier ON supplier_scorecards(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_scorecards_org ON supplier_scorecards(organization_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('child_labour', 'forced_labour', 'modern_slavery', 'unsafe_working_conditions', 'environmental_violation', 'corruption', 'sanctions', 'conflict_minerals', 'illegal_waste_disposal', 'deforestation', 'country_risk', 'political_risk', 'climate_risk')),
  title TEXT NOT NULL,
  description TEXT,
  likelihood TEXT NOT NULL CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  impact TEXT NOT NULL CHECK (impact IN ('negligible', 'minor', 'moderate', 'major', 'severe')),
  risk_score NUMERIC DEFAULT 0,
  mitigation_plan TEXT,
  owner_id UUID,
  owner_name TEXT,
  review_schedule TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'mitigated', 'closed', 'escalated')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_risks_supplier ON supplier_risks(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_risks_org ON supplier_risks(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_risks_type ON supplier_risks(organization_id, risk_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('desktop', 'remote', 'onsite', 'third_party', 'follow_up')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'follow_up_required', 'cancelled')),
  findings JSONB DEFAULT '[]',
  evidence JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  capas JSONB DEFAULT '[]',
  approvals JSONB DEFAULT '[]',
  auditor_id UUID,
  auditor_name TEXT,
  audit_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_audits_supplier ON supplier_audits(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_audits_org ON supplier_audits(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_audits_type ON supplier_audits(organization_id, audit_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_type TEXT NOT NULL CHECK (certification_type IN ('iso_14001', 'iso_45001', 'iso_9001', 'sa8000', 'smeta', 'bsci', 'wrap', 'fsc', 'fairtrade', 'rainforest_alliance', 'organic', 'custom')),
  certification_body TEXT,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending_renewal', 'revoked', 'suspended')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  evidence JSONB DEFAULT '[]',
  scope TEXT,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_certifications_supplier ON supplier_certifications(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_certifications_org ON supplier_certifications(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_certifications_type ON supplier_certifications(organization_id, certification_type) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS responsible_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  material_category TEXT NOT NULL CHECK (material_category IN ('raw_material', 'conflict_mineral', 'palm_oil', 'cotton', 'timber', 'recycled_material', 'mineral', 'chemical', 'component', 'other')),
  country_of_origin TEXT,
  traceability_id TEXT,
  supply_chain_mapping JSONB DEFAULT '[]',
  certifying_body TEXT,
  certification_status TEXT,
  chain_of_custody TEXT,
  quantity NUMERIC,
  unit TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responsible_materials_supplier ON responsible_materials(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_responsible_materials_org ON responsible_materials(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_responsible_materials_category ON responsible_materials(organization_id, material_category) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supply_chain_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('supplier', 'sub_supplier', 'factory', 'warehouse', 'production_site', 'distributor', 'retailer')),
  parent_node_id UUID REFERENCES supply_chain_nodes(id) ON DELETE CASCADE,
  country TEXT,
  region TEXT,
  city TEXT,
  address JSONB,
  relationship_type TEXT DEFAULT 'direct' CHECK (relationship_type IN ('direct', 'tier_2', 'tier_3', 'tier_n')),
  products_services JSONB DEFAULT '[]',
  capacity TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_supplier ON supply_chain_nodes(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_org ON supply_chain_nodes(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_parent ON supply_chain_nodes(parent_node_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS supplier_carbon_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
  category TEXT,
  emission_value NUMERIC,
  unit TEXT DEFAULT 'tCO2e',
  energy_consumption NUMERIC,
  energy_unit TEXT DEFAULT 'kWh',
  renewable_energy BOOLEAN DEFAULT FALSE,
  renewable_percentage NUMERIC DEFAULT 0,
  waste_generated NUMERIC,
  waste_unit TEXT DEFAULT 'tonnes',
  water_consumption NUMERIC,
  water_unit TEXT DEFAULT 'm3',
  reduction_project TEXT,
  target_value NUMERIC,
  target_year INT,
  baseline_value NUMERIC,
  emission_date DATE,
  reporting_period TEXT,
  source TEXT,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_carbon_supplier ON supplier_carbon_records(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_carbon_org ON supplier_carbon_records(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_carbon_scope ON supplier_carbon_records(organization_id, scope) WHERE is_deleted = FALSE;