export const ESCALATION_ENDPOINTS = {
  rules: '/api/v1/escalation/rules',
  rule: (id: string) => `/api/v1/escalation/rules/${id}`,
  ruleDelete: (id: string) => `/api/v1/escalation/rules/${id}`,
  evaluate: (id: string) => `/api/v1/escalation/rules/${id}/evaluate`,
  levels: '/api/v1/escalation/levels',
  level: (id: string) => `/api/v1/escalation/levels/${id}`,
  levelDelete: (id: string) => `/api/v1/escalation/levels/${id}`,
} as const;

export const ESCALATION_ROUTES = {
  rules: '/escalation-rules',
  ruleDetail: (id: string) => `/escalation-rules/${id}`,
  levels: '/escalation-levels',
} as const;

export const CONDITION_TYPE_LABELS: Record<string, string> = {
  priority: 'Priority',
  status: 'Status',
  category: 'Category',
  assignee: 'Assignee',
  sla_remaining: 'SLA Remaining (min)',
  age: 'Age (min)',
  label: 'Label',
  severity: 'Severity',
};

export const CONDITION_OPERATOR_LABELS: Record<string, string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  contains: 'Contains',
  in: 'In',
  not_in: 'Not In',
};
