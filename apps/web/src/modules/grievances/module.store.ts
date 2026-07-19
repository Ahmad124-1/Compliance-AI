'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { grievancesService } from './module.service.js';
import type {
  GrievanceSubmitInput,
  GrievanceTrackInput,
  CategoryCreateInput,
  PortalConfigInput,
  QrPortalInput,
} from './module.types.js';

export function useGrievanceCategories(organizationId?: string) {
  return useQuery({
    queryKey: ['grievances', 'categories', organizationId],
    queryFn: () => grievancesService.getCategories(organizationId),
  });
}

export function useGrievanceLanguages() {
  return useQuery({
    queryKey: ['grievances', 'languages'],
    queryFn: () => grievancesService.getLanguages(),
  });
}

export function useGrievanceSources() {
  return useQuery({
    queryKey: ['grievances', 'sources'],
    queryFn: () => grievancesService.getSources(),
  });
}

export function useGrievanceChannels() {
  return useQuery({
    queryKey: ['grievances', 'channels'],
    queryFn: () => grievancesService.getChannels(),
  });
}

export function useSubmitGrievance() {
  return useMutation({
    mutationFn: (dto: GrievanceSubmitInput) => grievancesService.submit(dto),
  });
}

export function useTrackGrievance() {
  return useMutation({
    mutationFn: (dto: GrievanceTrackInput) => grievancesService.track(dto),
  });
}

export function useGrievances(params?: { status?: string; category?: string; source?: string }) {
  return useQuery({
    queryKey: ['grievances', 'list', params],
    queryFn: () => grievancesService.list(params),
  });
}

export function useGrievance(id: string) {
  return useQuery({
    queryKey: ['grievances', id],
    queryFn: () => grievancesService.get(id),
    enabled: !!id,
  });
}

export function useGrievanceAttachments(id: string) {
  return useQuery({
    queryKey: ['grievances', id, 'attachments'],
    queryFn: () => grievancesService.getAttachments(id),
    enabled: !!id,
  });
}

export function useUpdateGrievance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: { status?: string; priority?: string; severity?: string | null } }) =>
      grievancesService.update(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['grievances', v.id] }),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['grievances', 'admin-categories'],
    queryFn: () => grievancesService.listCategories(),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CategoryCreateInput) => grievancesService.createCategory(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grievances', 'admin-categories'] }),
  });
}

export function usePortalConfig() {
  return useQuery({
    queryKey: ['grievances', 'portal-config'],
    queryFn: () => grievancesService.getPortalConfig(),
  });
}

export function useUpsertPortalConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PortalConfigInput) => grievancesService.upsertPortalConfig(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grievances', 'portal-config'] }),
  });
}

export function useQrPortals() {
  return useQuery({
    queryKey: ['grievances', 'qr-portals'],
    queryFn: () => grievancesService.listQrPortals(),
  });
}

export function useCreateQrPortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: QrPortalInput) => grievancesService.createQrPortal(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grievances', 'qr-portals'] }),
  });
}
