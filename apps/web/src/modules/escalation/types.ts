export type ConditionType =
  | 'priority'
  | 'status'
  | 'category'
  | 'assignee'
  | 'sla_remaining'
  | 'age'
  | 'label'
  | 'severity';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in'
  | 'not_in';

export interface EscalationLevel {
  id: string;
  organizationId: string;
  name: string;
  order: number;
  targetRole: string | null;
  targetUserId: string | null;
  targetTeamId: string | null;
  notifyChannels: string[];
  delayMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationRuleV2 {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  entityType: string;
  isActive: boolean;
  conditions: {
    type: ConditionType;
    operator: ConditionOperator;
    value: string | number | string[];
  }[];
  logic: 'all' | 'any';
  levels: { levelId: string; delayMinutes: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface EscalationRuleCreateInput {
  name: string;
  description?: string | null;
  entityType: string;
  isActive?: boolean;
  logic?: 'all' | 'any';
  conditions: {
    type: ConditionType;
    operator: ConditionOperator;
    value: string | number | string[];
  }[];
  levels: { levelId: string; delayMinutes: number }[];
}

export interface EscalationRuleUpdateInput {
  name?: string;
  description?: string | null;
  entityType?: string;
  isActive?: boolean;
  logic?: 'all' | 'any';
  conditions?: {
    type: ConditionType;
    operator: ConditionOperator;
    value: string | number | string[];
  }[];
  levels?: { levelId: string; delayMinutes: number }[];
}

export interface EscalationLevelCreateInput {
  name: string;
  order: number;
  targetRole?: string | null;
  targetUserId?: string | null;
  targetTeamId?: string | null;
  notifyChannels?: string[];
  delayMinutes?: number;
}
