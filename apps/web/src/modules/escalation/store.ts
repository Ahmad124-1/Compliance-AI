'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { escalationService } from './service.js';
import type {
  EscalationRuleCreateInput,
  EscalationRuleUpdateInput,
  EscalationLevelCreateInput,
} from './types.js';

interface EscalationUiState {
  search: string;
  entityType: string;
  setSearch: (v: string) => void;
  setEntityType: (v: string) => void;
  reset: () => void;
}

export const useEscalationUiStore = create<EscalationUiState>((set) => ({
  search: '',
  entityType: '',
  setSearch: (v) => set({ search: v }),
  setEntityType: (v) => set({ entityType: v }),
  reset: () => set({ search: '', entityType: '' }),
}));

export function useEscalationRules(params?: { entityType?: string; search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['escalation', 'rules', params],
    queryFn: () => escalationService.listRules(params),
  });
}

export function useEscalationRule(id: string) {
  return useQuery({
    queryKey: ['escalation', 'rules', id],
    queryFn: () => escalationService.getRule(id),
    enabled: !!id,
  });
}

export function useCreateEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EscalationRuleCreateInput) => escalationService.createRule(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escalation', 'rules'] }),
  });
}

export function useUpdateEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: EscalationRuleUpdateInput }) => escalationService.updateRule(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['escalation', 'rules', v.id] }),
  });
}

export function useDeleteEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalationService.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escalation', 'rules'] }),
  });
}

export function useEvaluateEscalationRule() {
  return useMutation({
    mutationFn: (vars: { id: string; entityId: string }) => escalationService.evaluateRule(vars.id, vars.entityId),
  });
}

export function useEscalationLevels() {
  return useQuery({
    queryKey: ['escalation', 'levels'],
    queryFn: () => escalationService.listLevels(),
  });
}

export function useEscalationLevel(id: string) {
  return useQuery({
    queryKey: ['escalation', 'levels', id],
    queryFn: () => escalationService.getLevel(id),
    enabled: !!id,
  });
}

export function useCreateEscalationLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EscalationLevelCreateInput) => escalationService.createLevel(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escalation', 'levels'] }),
  });
}

export function useUpdateEscalationLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<EscalationLevelCreateInput> }) =>
      escalationService.updateLevel(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['escalation', 'levels', v.id] }),
  });
}

export function useDeleteEscalationLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalationService.deleteLevel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escalation', 'levels'] }),
  });
}
