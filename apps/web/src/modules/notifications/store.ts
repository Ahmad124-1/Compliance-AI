'use client';

import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsService } from './service.js';
import type {
  NotificationCreateInput,
  NotificationUpdateInput,
  PreferenceUpdateInput,
  NotificationListParams,
} from './types.js';

interface NotificationUiState {
  filterStatus: string;
  filterType: string;
  filterChannel: string;
  search: string;
  setFilterStatus: (v: string) => void;
  setFilterType: (v: string) => void;
  setFilterChannel: (v: string) => void;
  setSearch: (v: string) => void;
  reset: () => void;
}

export const useNotificationUiStore = create<NotificationUiState>((set) => ({
  filterStatus: '',
  filterType: '',
  filterChannel: '',
  search: '',
  setFilterStatus: (v) => set({ filterStatus: v }),
  setFilterType: (v) => set({ filterType: v }),
  setFilterChannel: (v) => set({ filterChannel: v }),
  setSearch: (v) => set({ search: v }),
  reset: () => set({ filterStatus: '', filterType: '', filterChannel: '', search: '' }),
}));

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: () => notificationsService.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 30000,
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationsService.stats(),
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => notificationsService.get(id),
    enabled: !!id,
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: NotificationCreateInput) => notificationsService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useUpdateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: NotificationUpdateInput }) => notificationsService.update(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['notifications', v.id] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkUnread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markUnread(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useArchiveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsService.listPreferences(),
  });
}

export function useUpdatePreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: PreferenceUpdateInput }) => notificationsService.updatePreference(vars.id, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });
}

export function useNotificationDeliveries(id: string) {
  return useQuery({
    queryKey: ['notifications', id, 'deliveries'],
    queryFn: () => notificationsService.getDeliveries(id),
    enabled: !!id,
  });
}
