'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queueService } from './service.js';

interface QueueUiState {
  statusFilter: string;
  queueFilter: string;
  search: string;
  setStatusFilter: (v: string) => void;
  setQueueFilter: (v: string) => void;
  setSearch: (v: string) => void;
  reset: () => void;
}

export const useQueueUiStore = create<QueueUiState>((set) => ({
  statusFilter: '',
  queueFilter: '',
  search: '',
  setStatusFilter: (v) => set({ statusFilter: v }),
  setQueueFilter: (v) => set({ queueFilter: v }),
  setSearch: (v) => set({ search: v }),
  reset: () => set({ statusFilter: '', queueFilter: '', search: '' }),
}));

export function useQueueJobs(params?: { queueName?: string; status?: string }) {
  return useQuery({
    queryKey: ['queue', 'jobs', params ?? {}],
    queryFn: () => queueService.list(params),
  });
}

export function useQueueStats(queueName?: string) {
  return useQuery({
    queryKey: ['queue', 'stats', queueName ?? 'all'],
    queryFn: () => queueService.stats(queueName),
  });
}

export function useDequeue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) => queueService.dequeue(queueName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.retry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}

export function useDeadLetterJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.deadLetter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}

export function useProcessDeadLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.processDeadLetter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}

export function useCleanupQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (olderThan?: string) => queueService.cleanup(olderThan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });
}
