import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { autonomousApi } from './api.js';

export function useAutomationRules(filters: { triggerType?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ['automation-rules', filters],
    queryFn: () => autonomousApi.automationRules(filters),
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => autonomousApi.createAutomationRule(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
  });
}

export function useUpdateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => autonomousApi.updateAutomationRule(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
  });
}

export function useDeleteAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autonomousApi.deleteAutomationRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
  });
}

export function useWorkflows(filters: { category?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => autonomousApi.workflows(filters),
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => autonomousApi.createWorkflow(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => autonomousApi.updateWorkflow(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autonomousApi.deleteWorkflow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useExecuteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, inputParams }: { id: string; inputParams?: Record<string, unknown> }) => autonomousApi.executeWorkflow(id, inputParams),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions'] }),
  });
}

export function useActions(filters: { status?: string; priority?: string; actionType?: string; limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ['actions', filters],
    queryFn: () => autonomousApi.actions(filters),
  });
}

export function useGetAction(id: string) {
  return useQuery({
    queryKey: ['action', id],
    queryFn: () => autonomousApi.getAction(id),
    enabled: !!id,
  });
}

export function useApproveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, decision, comments }: { actionId: string; decision?: string; comments?: string }) => autonomousApi.approveAction(actionId, decision, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRejectAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, reason }: { actionId: string; reason?: string }) => autonomousApi.rejectAction(actionId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useModifyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, modifications, comments }: { actionId: string; modifications: Record<string, unknown>; comments?: string }) => autonomousApi.modifyAction(actionId, modifications, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useApprovals(filters: { actionId?: string; status?: string; approverId?: string } = {}) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () => autonomousApi.approvals(filters),
  });
}

export function useExecuteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => autonomousApi.executeAction(actionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['execution-logs'] });
    },
  });
}

export function useExecutionLogs(filters: { actionId?: string; status?: string; limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ['execution-logs', filters],
    queryFn: () => autonomousApi.executionLogs(filters),
  });
}

export function useDecisionHistory(filters: { decisionType?: string; isApproved?: boolean; limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ['decision-history', filters],
    queryFn: () => autonomousApi.decisionHistory(filters),
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => autonomousApi.automationStats(),
  });
}

export function useRunAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { triggerType: string; context: Record<string, unknown> }) => autonomousApi.runAutomation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}
