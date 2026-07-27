import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export interface AutomationRuleInput {
  name: string;
  description?: string;
  triggerType: string;
  triggerConditions: Record<string, unknown>;
  actions: Record<string, unknown>[];
  requiresApproval?: boolean;
  approvalRoles?: string[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowDefinitionInput {
  name: string;
  description?: string;
  category: string;
  steps: Record<string, unknown>[];
  variables: Record<string, unknown>;
  isSystem?: boolean;
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface RunAutomationInput {
  triggerType: string;
  context: Record<string, unknown>;
}

export const autonomousApi = {
  automationRules: (filters: { triggerType?: string; isActive?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.triggerType) params.set('triggerType', filters.triggerType);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
    const qs = params.toString();
    return http<any[]>(`/automation/rules${qs ? `?${qs}` : ''}`);
  },

  createAutomationRule: (input: AutomationRuleInput) =>
    http<any>('/automation/rules', { method: 'POST', body: JSON.stringify(input) }),

  getAutomationRule: (id: string) =>
    http<any>(`/automation/rules/${id}`),

  updateAutomationRule: (id: string, input: AutomationRuleInput) =>
    http<any>(`/automation/rules/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteAutomationRule: (id: string) =>
    http<any>(`/automation/rules/${id}`, { method: 'DELETE' }),

  workflows: (filters: { category?: string; isActive?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
    const qs = params.toString();
    return http<any[]>(`/workflows${qs ? `?${qs}` : ''}`);
  },

  createWorkflow: (input: WorkflowDefinitionInput) =>
    http<any>('/workflows', { method: 'POST', body: JSON.stringify(input) }),

  getWorkflow: (id: string) =>
    http<any>(`/workflows/${id}`),

  updateWorkflow: (id: string, input: WorkflowDefinitionInput) =>
    http<any>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteWorkflow: (id: string) =>
    http<any>(`/workflows/${id}`, { method: 'DELETE' }),

  executeWorkflow: (id: string, inputParams?: Record<string, unknown>) =>
    http<any>(`/workflows/${id}/execute`, { method: 'POST', body: JSON.stringify({ inputParams }) }),

  actions: (filters: { status?: string; priority?: string; actionType?: string; limit?: number; offset?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.actionType) params.set('actionType', filters.actionType);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return http<{ actions: any[]; total: number }>(`/actions${qs ? `?${qs}` : ''}`);
  },

  getAction: (id: string) =>
    http<any>(`/actions/${id}`),

  approveAction: (actionId: string, decision?: string, comments?: string) =>
    http<any>(`/approval/${actionId}/approve`, { method: 'POST', body: JSON.stringify({ decision, comments }) }),

  rejectAction: (actionId: string, reason?: string) =>
    http<any>(`/approval/${actionId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  modifyAction: (actionId: string, modifications: Record<string, unknown>, comments?: string) =>
    http<any>(`/approval/${actionId}/modify`, { method: 'POST', body: JSON.stringify({ modifications, comments }) }),

  approvals: (filters: { actionId?: string; status?: string; approverId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.actionId) params.set('actionId', filters.actionId);
    if (filters.status) params.set('status', filters.status);
    if (filters.approverId) params.set('approverId', filters.approverId);
    const qs = params.toString();
    return http<any[]>(`/approval${qs ? `?${qs}` : ''}`);
  },

  executeAction: (actionId: string) =>
    http<any>(`/execution/${actionId}/run`, { method: 'POST' }),

  executionLogs: (filters: { actionId?: string; status?: string; limit?: number; offset?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.actionId) params.set('actionId', filters.actionId);
    if (filters.status) params.set('status', filters.status);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return http<{ logs: any[]; total: number }>(`/execution/logs${qs ? `?${qs}` : ''}`);
  },

  decisionHistory: (filters: { decisionType?: string; isApproved?: boolean; limit?: number; offset?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.decisionType) params.set('decisionType', filters.decisionType);
    if (filters.isApproved !== undefined) params.set('isApproved', String(filters.isApproved));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return http<{ decisions: any[]; total: number }>(`/history${qs ? `?${qs}` : ''}`);
  },

  automationStats: () =>
    http<any>('/stats'),

  runAutomation: (input: RunAutomationInput) =>
    http<any>('/run', { method: 'POST', body: JSON.stringify(input) }),
};
