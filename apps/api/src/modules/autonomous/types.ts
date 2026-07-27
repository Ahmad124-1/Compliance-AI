export type AutomationRuleStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed' | 'rolled_back';
export type ActionType = 'capa_create' | 'audit_plan' | 'policy_update' | 'training_assign' | 'supplier_audit' | 'notification_send' | 'escalation' | 'evidence_request' | 'custom';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'modified';
export type ExecutionStatus = 'success' | 'failure' | 'partial' | 'skipped';
export type DecisionType = 'capa' | 'audit' | 'supplier' | 'policy' | 'training' | 'worker' | 'general';
export type WorkflowCategory = 'capa' | 'audit' | 'supplier' | 'policy' | 'training' | 'worker' | 'general';

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConditions: Record<string, unknown>;
  actions: Record<string, unknown>[];
  isActive: boolean;
  requiresApproval: boolean;
  approvalRoles: string[];
  metadata: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedAction {
  id: string;
  organizationId: string;
  ruleId?: string;
  actionType: string;
  title: string;
  description?: string;
  reason?: string;
  confidenceScore: number;
  dataUsed: Record<string, unknown>;
  impact?: string;
  risk?: string;
  estimatedTimeSaved?: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  priority: string;
  createdBy?: string;
  assignedTo?: string;
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
  rolledBackAt?: string;
  parentActionId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  organizationId: string;
  actionId: string;
  status: ApprovalStatus;
  decision?: string;
  comments?: string;
  approverId: string;
  decidedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  organizationId: string;
  actionId: string;
  status: ExecutionStatus;
  result: Record<string, unknown>;
  errorMessage?: string;
  executionTimeMs?: number;
  executedBy?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowDefinition {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  steps: Record<string, unknown>[];
  variables: Record<string, unknown>;
  isActive: boolean;
  isSystem: boolean;
  version: string;
  metadata: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIDecisionRecord {
  id: string;
  organizationId: string;
  decisionType: DecisionType;
  context: Record<string, unknown>;
  reasoning?: string;
  confidenceScore: number;
  decision: Record<string, unknown>;
  outcome?: string;
  outcomeDetails: Record<string, unknown>;
  approverId?: string;
  approverComments?: string;
  isApproved?: boolean;
  executed: boolean;
  rolledBack: boolean;
  rollbackReason?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationStats {
  totalActions: number;
  pendingApproval: number;
  completedJobs: number;
  failedJobs: number;
  executionHistory: Array<{ date: string; count: number; success: number }>;
}
