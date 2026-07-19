'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { slaService } from './service.js';
import type { SlaDefinition, SlaWorkingHours, SlaHolidayCalendar, SlaInstanceListParams } from './types.js';

interface SlaUiState {
  filterStatus: string;
  filterType: string;
  search: string;
  setFilterStatus: (v: string) => void;
  setFilterType: (v: string) => void;
  setSearch: (v: string) => void;
  reset: () => void;
}

export const useSlaUiStore = create<SlaUiState>((set) => ({
  filterStatus: '',
  filterType: '',
  search: '',
  setFilterStatus: (v) => set({ filterStatus: v }),
  setFilterType: (v) => set({ filterType: v }),
  setSearch: (v) => set({ search: v }),
  reset: () => set({ filterStatus: '', filterType: '', search: '' }),
}));

export function useSlaDefinitions(params?: { type?: string; category?: string; search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['sla', 'definitions', params],
    queryFn: () => slaService.listDefinitions(params),
  });
}

export function useSlaDefinition(id: string) {
  return useQuery({
    queryKey: ['sla', 'definitions', id],
    queryFn: () => slaService.getDefinition(id),
    enabled: !!id,
  });
}

export function useCreateSlaDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<SlaDefinition>) => slaService.createDefinition(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla', 'definitions'] }),
  });
}

export function useUpdateSlaDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<SlaDefinition> }) => slaService.updateDefinition(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['sla', 'definitions', v.id] }),
  });
}

export function useDeleteSlaDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slaService.deleteDefinition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla', 'definitions'] }),
  });
}

export function useSlaInstances(params?: SlaInstanceListParams) {
  return useQuery({
    queryKey: ['sla', 'instances', params],
    queryFn: () => slaService.listInstances(params),
  });
}

export function useSlaInstance(id: string) {
  return useQuery({
    queryKey: ['sla', 'instances', id],
    queryFn: () => slaService.getInstance(id),
    enabled: !!id,
  });
}

export function usePauseSlaInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string | null }) => slaService.pauseInstance(vars.id, vars.reason),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['sla', 'instances', v.id] }),
  });
}

export function useResumeSlaInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slaService.resumeInstance(id),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['sla', 'instances', id] }),
  });
}

export function useSlaWorkingHours() {
  return useQuery({
    queryKey: ['sla', 'working-hours'],
    queryFn: () => slaService.listWorkingHours(),
  });
}

export function useSaveSlaWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<SlaWorkingHours>) => slaService.saveWorkingHours(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla', 'working-hours'] }),
  });
}

export function useSlaHolidayCalendars() {
  return useQuery({
    queryKey: ['sla', 'holiday-calendars'],
    queryFn: () => slaService.listHolidayCalendars(),
  });
}

export function useSaveHolidayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<SlaHolidayCalendar>) => slaService.saveHolidayCalendar(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla', 'holiday-calendars'] }),
  });
}
