'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { templatesService } from './service.js';
import type { MessageTemplateCreateInput, MessageTemplateUpdateInput } from './types.js';

interface TemplateUiState {
  filterChannel: string;
  filterCategory: string;
  search: string;
  setFilterChannel: (v: string) => void;
  setFilterCategory: (v: string) => void;
  setSearch: (v: string) => void;
  reset: () => void;
}

export const useTemplateUiStore = create<TemplateUiState>((set) => ({
  filterChannel: '',
  filterCategory: '',
  search: '',
  setFilterChannel: (v) => set({ filterChannel: v }),
  setFilterCategory: (v) => set({ filterCategory: v }),
  setSearch: (v) => set({ search: v }),
  reset: () => set({ filterChannel: '', filterCategory: '', search: '' }),
}));

export function useTemplates(params?: { channel?: string; category?: string; search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['templates', 'list', params],
    queryFn: () => templatesService.list(params),
  });
}

export function useTemplateStats() {
  return useQuery({
    queryKey: ['templates', 'stats'],
    queryFn: () => templatesService.stats(),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templatesService.get(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: MessageTemplateCreateInput) => templatesService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: MessageTemplateUpdateInput }) => templatesService.update(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['templates', v.id] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useRenderTemplate() {
  return useMutation({
    mutationFn: (vars: { id: string; dto: { templateId: string; variables: Record<string, string> } }) =>
      templatesService.render(vars.id, vars.dto),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}
