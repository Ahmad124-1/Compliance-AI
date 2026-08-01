-- Sprint 8C: Complete existing modules
-- Supplier Carbon Targets table (frontend module expects /suppliers/carbon/targets)

CREATE TABLE IF NOT EXISTS supplier_carbon_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
  target_value NUMERIC NOT NULL,
  baseline_value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'tCO2e',
  target_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'missed')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_carbon_targets_supplier ON supplier_carbon_targets(supplier_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_carbon_targets_org ON supplier_carbon_targets(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_supplier_carbon_targets_scope ON supplier_carbon_targets(organization_id, scope) WHERE is_deleted = FALSE;

