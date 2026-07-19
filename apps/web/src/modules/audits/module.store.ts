import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auditApi } from './module.api.js';

export function useAudits() {
  return useQuery({ queryKey: ['audits'], queryFn: () => auditApi.list() });
}

export function useAudit(id: string) {
  return useQuery({ queryKey: ['audits', id], queryFn: () => auditApi.get(id), enabled: !!id });
}

export function useAuditMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (dto: Record<string, unknown>) => auditApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  });

  const start = useMutation({
    mutationFn: (id: string) => auditApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  });

  const complete = useMutation({
    mutationFn: (id: string) => auditApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  });

  return { create, start, complete };
}
