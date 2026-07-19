'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { standardsService } from './module.service.js';
import type {
  Standard,
  Framework,
  Clause,
  Requirement,
  Control,
  OrganizationFramework,
  FrameworkAssignment,
  FrameworkProgress,
  StandardsDashboard,
  SearchResult,
  AssignmentScope,
  ControlStatusState,
} from './module.types.js';

export function useStandards(params?: { search?: string; category?: string; activeOnly?: boolean }) {
  return useQuery({
    queryKey: ['standards', 'list', params],
    queryFn: () => standardsService.list(params),
  });
}

export function useStandard(id: string) {
  return useQuery({
    queryKey: ['standards', id],
    queryFn: () => standardsService.get(id),
    enabled: !!id,
  });
}

export function useStandardFrameworks(id: string) {
  return useQuery({
    queryKey: ['standards', id, 'frameworks'],
    queryFn: () => standardsService.frameworksFor(id),
    enabled: !!id,
  });
}

export function useStandardsDashboard() {
  return useQuery({
    queryKey: ['standards', 'dashboard'],
    queryFn: () => standardsService.dashboard(),
  });
}

export function useCreateStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: standardsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards', 'list'] }),
  });
}

export function useUpdateStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: Partial<Standard> }) => standardsService.update(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['standards', v.id] }),
  });
}

export function useFrameworks() {
  return useQuery({
    queryKey: ['frameworks', 'list'],
    queryFn: () => standardsService.listFrameworks(),
  });
}

export function useFramework(id: string) {
  return useQuery({
    queryKey: ['frameworks', id],
    queryFn: () => standardsService.getFramework(id),
    enabled: !!id,
  });
}

export function useClauseTree(id: string) {
  return useQuery({
    queryKey: ['frameworks', id, 'clause-tree'],
    queryFn: () => standardsService.clauseTree(id),
    enabled: !!id,
  });
}

export function useFrameworkCategories(id: string) {
  return useQuery({
    queryKey: ['frameworks', id, 'categories'],
    queryFn: () => standardsService.categories(id),
    enabled: !!id,
  });
}

export function useRequirements(id: string, params?: { search?: string; categoryId?: string; clauseId?: string; mandatory?: boolean }) {
  return useQuery({
    queryKey: ['frameworks', id, 'requirements', params],
    queryFn: () => standardsService.requirements(id, params),
    enabled: !!id,
  });
}

export function useControlsForRequirement(frameworkId: string, reqId: string) {
  return useQuery({
    queryKey: ['frameworks', frameworkId, 'requirements', reqId, 'controls'],
    queryFn: () => standardsService.controlsForRequirement(frameworkId, reqId),
    enabled: !!frameworkId && !!reqId,
  });
}

export function useAdoptedFrameworks() {
  return useQuery({
    queryKey: ['organization-frameworks', 'list'],
    queryFn: () => standardsService.listAdopted(),
  });
}

export function useEnableFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: standardsService.enable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization-frameworks', 'list'] }),
  });
}

export function useDisableFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: standardsService.disable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization-frameworks', 'list'] }),
  });
}

export function useFrameworkSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: Record<string, unknown> }) => standardsService.settings(vars.id, vars.dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization-frameworks', 'list'] }),
  });
}

export function useAssignments(id: string) {
  return useQuery({
    queryKey: ['organization-frameworks', id, 'assignments'],
    queryFn: () => standardsService.listAssignments(id),
    enabled: !!id,
  });
}

export function useAddAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; scope: AssignmentScope; siteId?: string | null; departmentId?: string | null }) =>
      standardsService.addAssignment(vars.id, vars.scope, vars.siteId, vars.departmentId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['organization-frameworks', v.id, 'assignments'] }),
  });
}

export function useRemoveAssignment() {
  return useMutation({
    mutationFn: (vars: { id: string; assignId: string }) => standardsService.removeAssignment(vars.id, vars.assignId),
    onSuccess: () => {
      // Note: query invalidation for nested assignment lists would require a more specific query key pattern.
    },
  });
}

export function useSetApplicability() {
  return useMutation({
    mutationFn: (vars: { id: string; reqId: string; applicable: boolean; notes?: string | null }) =>
      standardsService.setApplicability(vars.id, vars.reqId, vars.applicable, vars.notes),
  });
}

export function useControlStatuses(id: string) {
  return useQuery({
    queryKey: ['organization-frameworks', id, 'control-status'],
    queryFn: () => standardsService.controlStatuses(id),
    enabled: !!id,
  });
}

export function useSetControlStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; controlId: string; status: ControlStatusState; ownerId?: string | null; notes?: string | null }) =>
      standardsService.setControlStatus(vars.id, vars.controlId, vars.status, vars.ownerId, vars.notes),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['organization-frameworks', v.id, 'control-status'] }),
  });
}

export function useFrameworkProgress(id: string) {
  return useQuery({
    queryKey: ['organization-frameworks', id, 'progress'],
    queryFn: () => standardsService.progress(id),
    enabled: !!id,
  });
}

export function useComplianceStatuses(id: string) {
  return useQuery({
    queryKey: ['organization-frameworks', id, 'compliance'],
    queryFn: () => standardsService.compliance(id),
    enabled: !!id,
  });
}

export function useSearchStandards() {
  return useQuery({
    queryKey: ['standards', 'search'],
    queryFn: ({ queryKey }) => {
      const [, , q] = queryKey;
      return standardsService.search(q as string);
    },
  });
}

export type {
  Standard,
  Framework,
  Clause,
  Requirement,
  Control,
  OrganizationFramework,
  FrameworkAssignment,
  FrameworkProgress,
  StandardsDashboard,
  SearchResult,
};
