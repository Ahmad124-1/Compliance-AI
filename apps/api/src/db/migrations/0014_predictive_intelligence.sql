-- 0014_predictive_intelligence.sql
-- Sprint 5D – Predictive Intelligence Engine
--
-- Adds tables for:
--   * predictions            — stored prediction records
--   * prediction_models      — model metadata and accuracy tracking
--   * trend_data             — computed trend snapshots
--   * scenario_simulations   — what-if scenario runs
--   * recommendations        — AI-generated recommendations
--   * forecast_snapshots     — time-series forecast history

-- ---------------------------------------------------------------------------
-- Predictions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  probability NUMERIC NOT NULL DEFAULT 0,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  reasoning TEXT,
  suggested_actions TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  timeframe TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predictions_org ON predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(type);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON predictions(category);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

-- ---------------------------------------------------------------------------
-- Prediction Models (accuracy tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prediction_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  accuracy NUMERIC NOT NULL DEFAULT 0,
  precision_score NUMERIC NOT NULL DEFAULT 0,
  recall_score NUMERIC NOT NULL DEFAULT 0,
  training_data_count INT NOT NULL DEFAULT 0,
  last_trained_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prediction_models_org ON prediction_models(organization_id);
CREATE INDEX IF NOT EXISTS idx_prediction_models_type ON prediction_models(type);

-- ---------------------------------------------------------------------------
-- Trend Data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  period TEXT NOT NULL,
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_percent NUMERIC,
  direction TEXT NOT NULL DEFAULT 'stable',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trend_data_org ON trend_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_trend_data_metric ON trend_data(metric);
CREATE INDEX IF NOT EXISTS idx_trend_data_period ON trend_data(period);
CREATE INDEX IF NOT EXISTS idx_trend_data_computed ON trend_data(computed_at);

-- ---------------------------------------------------------------------------
-- Scenario Simulations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scenario_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  projected_compliance_score NUMERIC,
  projected_audit_readiness NUMERIC,
  projected_violations INT,
  projected_improvement NUMERIC,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenario_simulations_org ON scenario_simulations(organization_id);
CREATE INDEX IF NOT EXISTS idx_scenario_simulations_type ON scenario_simulations(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenario_simulations_created ON scenario_simulations(created_at);

-- ---------------------------------------------------------------------------
-- AI Recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  expected_impact TEXT,
  reason TEXT,
  estimated_effort TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  action_taken BOOLEAN NOT NULL DEFAULT FALSE,
  actioned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  actioned_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_org ON recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at);

-- ---------------------------------------------------------------------------
-- Forecast Snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL,
  horizon_days INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_org ON forecast_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_type ON forecast_snapshots(forecast_type);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_computed ON forecast_snapshots(computed_at);
