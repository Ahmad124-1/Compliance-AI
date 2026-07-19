'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commSettingsService } from './service.js';

export function useCommSettings() {
  return useQuery({
    queryKey: ['comm-settings'],
    queryFn: () => commSettingsService.get(),
  });
}

export function useUpdateCommSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => commSettingsService.update(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm-settings'] }),
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branding: Record<string, unknown>) => commSettingsService.updateBranding(branding),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm-settings'] }),
  });
}

export function useUpdateChannels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channels: Record<string, boolean>) => commSettingsService.updateChannels(channels),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm-settings'] }),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => commSettingsService.updateNotifications(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm-settings'] }),
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => commSettingsService.updatePrivacy(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm-settings'] }),
  });
}
