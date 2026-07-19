import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { capaApi } from './module.api.js';

type CAPAItem = { id: string; title: string };

type FindingItem = CAPAItem & { severity?: string; status?: string };
type NonConformityItem = CAPAItem & { severity?: string; status?: string };

export function useCAPAFindings() {
  return useQuery<FindingItem[]>({ queryKey: ['capa', 'findings'], queryFn: () => capaApi.listFindings() as Promise<FindingItem[]> });
}

export function useCAPANonConformities() {
  return useQuery<NonConformityItem[]>({ queryKey: ['capa', 'non-conformities'], queryFn: () => capaApi.listNonConformities() as Promise<NonConformityItem[]> });
}

export function useCAPAs() {
  return useQuery<CAPAItem[]>({ queryKey: ['capa', 'items'], queryFn: () => capaApi.listCAPAs() as Promise<CAPAItem[]> });
}

export function useCreateCAPA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => capaApi.createCAPA(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capa'] }),
  });
}
