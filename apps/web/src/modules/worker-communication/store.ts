'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { workerCommService } from './service.js';
import type { StatusUpdate } from './types.js';

interface WorkerCommUiState {
  search: string;
  setSearch: (v: string) => void;
}

export const useWorkerCommUiStore = create<WorkerCommUiState>((set) => ({
  search: '',
  setSearch: (v) => set({ search: v }),
}));

export function useStatusUpdates(caseId?: string) {
  return useQuery({
    queryKey: ['worker-comm', 'status-updates', caseId ?? 'all'],
    queryFn: () => workerCommService.listStatusUpdates(caseId),
  });
}

export function useTimeline(caseId: string) {
  return useQuery({
    queryKey: ['worker-comm', 'timeline', caseId],
    queryFn: () => workerCommService.getTimeline(caseId),
    enabled: !!caseId,
  });
}

export function useSendStatusUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<StatusUpdate>) => workerCommService.sendStatusUpdate(dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['worker-comm', 'status-updates', v.caseId] }),
  });
}

export function usePublicMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; message: string }) => workerCommService.sendPublicMessage(vars.caseId, vars.message),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['worker-comm', v.caseId] }),
  });
}

export function useRequestInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; message: string }) => workerCommService.requestInfo(vars.caseId, vars.message),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['worker-comm', v.caseId] }),
  });
}

export function useAcknowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => workerCommService.acknowledge(caseId),
    onSuccess: (_d, caseId) => qc.invalidateQueries({ queryKey: ['worker-comm', caseId] }),
  });
}

export function useResolutionNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; message: string }) => workerCommService.sendResolutionNotice(vars.caseId, vars.message),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['worker-comm', v.caseId] }),
  });
}

export function useCloseCaseMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => workerCommService.close(caseId),
    onSuccess: (_d, caseId) => qc.invalidateQueries({ queryKey: ['worker-comm', caseId] }),
  });
}

export function useRequestFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => workerCommService.requestFeedback(caseId),
    onSuccess: (_d, caseId) => qc.invalidateQueries({ queryKey: ['worker-comm', caseId] }),
  });
}
