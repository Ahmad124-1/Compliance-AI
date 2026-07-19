export type ConditionType = 'time_sla' | 'priority' | 'severity' | 'category' | 'factory' | 'department' | 'country' | 'organization';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';

export interface EscalationLevel {
  id: string;
  organizationId: string;
  name: string;
  level: number;
  description: string | null;
  roleId: string | null;
  notifyRoles: string[];
  autoEscalateAfterMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationRuleV2 {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  conditionType: ConditionType;
  conditionValue: string;
  conditionOperator: ConditionOperator;
  escalateToLevelId: string | null;
  escalateToRoleId: string | null;
  escalateToUserId: string | null;
  notificationChannels: string[];
  autoEscalate: boolean;
  autoEscalateAfterMinutes: number | null;
  requireApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
