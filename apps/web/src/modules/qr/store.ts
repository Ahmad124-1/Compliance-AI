'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qrService } from './service.js';
import type { QrCode } from './types.js';

interface QrUiState {
  search: string;
  typeFilter: string;
  scopeFilter: string;
  setSearch: (v: string) => void;
  setTypeFilter: (v: string) => void;
  setScopeFilter: (v: string) => void;
  reset: () => void;
}

export const useQrUiStore = create<QrUiState>((set) => ({
  search: '',
  typeFilter: '',
  scopeFilter: '',
  setSearch: (v) => set({ search: v }),
  setTypeFilter: (v) => set({ typeFilter: v }),
  setScopeFilter: (v) => set({ scopeFilter: v }),
  reset: () => set({ search: '', typeFilter: '', scopeFilter: '' }),
}));

export function useQrCodes(params?: { type?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['qr', 'list', params],
    queryFn: () => qrService.list(params),
  });
}

export function useQrStats() {
  return useQuery({
    queryKey: ['qr', 'stats'],
    queryFn: () => qrService.stats(),
  });
}

export function useQrCode(id: string) {
  return useQuery({
    queryKey: ['qr', id],
    queryFn: () => qrService.get(id),
    enabled: !!id,
  });
}

export function useCreateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<QrCode>) => qrService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr'] }),
  });
}

export function useUpdateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<QrCode> }) => qrService.update(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['qr', v.id] }),
  });
}

export function useDeleteQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr'] }),
  });
}

export function useRegenerateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrService.regenerate(id),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['qr', id] }),
  });
}

export function useQrAnalytics(id?: string) {
  return useQuery({
    queryKey: ['qr', 'analytics', id ?? 'org'],
    queryFn: () => qrService.analytics(id),
  });
}

export function useQrScans(id?: string) {
  return useQuery({
    queryKey: ['qr', 'scans', id ?? 'org'],
    queryFn: () => qrService.analytics(id),
  });
}
