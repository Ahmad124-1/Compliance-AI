'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tenantService } from './module.service.js';
import type { Department, Organization, Site, Team } from './module.types.js';

export function useOrganizations() {
  return useQuery({ queryKey: ['tenants', 'orgs'], queryFn: tenantService.listOrganizations });
}
export function useSites() {
  return useQuery({ queryKey: ['tenants', 'sites'], queryFn: tenantService.listSites });
}
export function useDepartments() {
  return useQuery({ queryKey: ['tenants', 'departments'], queryFn: tenantService.listDepartments });
}
export function useTeams() {
  return useQuery({ queryKey: ['tenants', 'teams'], queryFn: tenantService.listTeams });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantService.createOrganization,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', 'orgs'] }),
  });
}
export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantService.createSite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', 'sites'] }),
  });
}
export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantService.createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', 'departments'] }),
  });
}
export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantService.createTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', 'teams'] }),
  });
}

export type { Organization, Site, Department, Team };
