-- 0015_autonomous_compliance.sql
-- Sprint 5E – Autonomous Compliance Engine
--
-- Adds tables for:
--   * automation_rules         — workflow/automation definitions
--   * action_queue             — AI-generated actions pending approval
--   * approvals                — approval records for actions
--   * execution_logs           — execution history of automations
--   * workflow_definitions     — reusable workflow templates
--   * ai_decision_history      — comprehensive AI decision audit trail

-- ---------------------------------------------------------------------------
-- Automation Rules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  approval_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);

-- ---------------------------------------------------------------------------
-- Action Queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  data_used JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact TEXT,
  risk TEXT,
  estimated_time_saved TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  parent_action_id UUID REFERENCES action_queue(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_queue_org ON action_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_queue_rule ON action_queue(rule_id);
CREATE INDEX IF NOT EXISTS idx_action_queue_status ON action_queue(status);
CREATE INDEX IF NOT EXISTS idx_action_queue_priority ON action_queue(priority);
CREATE INDEX IF NOT EXISTS idx_action_queue_created ON action_queue(created_at);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES action_queue(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  decision TEXT,
  comments TEXT,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decided_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_org ON approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_approvals_action ON approvals(action_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id);

-- ---------------------------------------------------------------------------
-- Execution Logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES action_queue(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  execution_time_ms INT,
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_org ON execution_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_action ON execution_logs(action_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created ON execution_logs(created_at);

-- ---------------------------------------------------------------------------
-- Workflow Definitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  version TEXT NOT NULL DEFAULT '1.0',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_category ON workflow_definitions(category);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON workflow_definitions(is_active);

-- ---------------------------------------------------------------------------
-- AI Decision History
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_decision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasoning TEXT,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome TEXT,
  outcome_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_comments TEXT,
  is_approved BOOLEAN,
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  rolled_back BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_decision_history_org ON ai_decision_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_history_type ON ai_decision_history(decision_type);
CREATE INDEX IF NOT EXISTS idx_ai_decision_history_created ON ai_decision_history(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_decision_history_approved ON ai_decision_history(is_approved);
