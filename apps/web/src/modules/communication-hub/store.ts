'use client';

import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { communicationHubService } from './service.js';

export interface CommunicationHubUiState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useCommunicationHubUiStore = create<CommunicationHubUiState>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export function useConversations() {
  return useQuery({
    queryKey: ['communication-hub', 'conversations'],
    queryFn: () => communicationHubService.listConversations(),
  });
}

export function useInbox() {
  return useQuery({
    queryKey: ['communication-hub', 'inbox'],
    queryFn: () => communicationHubService.getInbox(),
  });
}

export function useBroadcasts(params?: { broadcastType?: string; priority?: string }) {
  return useQuery({
    queryKey: ['communication-hub', 'broadcasts', params],
    queryFn: () => communicationHubService.listBroadcasts(params),
  });
}

export function useEmergencyAlerts(params?: { alertType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['communication-hub', 'emergency', params],
    queryFn: () => communicationHubService.listEmergencyAlerts(params),
    refetchInterval: 30000,
  });
}

export function useCalendarEvents(params?: { eventType?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['communication-hub', 'calendar', params],
    queryFn: () => communicationHubService.listCalendarEvents(params),
  });
}

export function useCommunicationAnalytics() {
  return useQuery({
    queryKey: ['communication-hub', 'analytics'],
    queryFn: () => communicationHubService.getAnalytics(),
  });
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => communicationHubService.createBroadcast(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication-hub', 'broadcasts'] }),
  });
}

export function useCreateEmergencyAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => communicationHubService.createEmergencyAlert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication-hub', 'emergency'] }),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => communicationHubService.createCalendarEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication-hub', 'calendar'] }),
  });
}

export function useAcknowledgeEmergency() {
  return useMutation({
    mutationFn: ({ alertId, data }: { alertId: string; data: { status?: string; note?: string; location?: Record<string, unknown> } }) =>
      communicationHubService.acknowledgeEmergency(alertId, data),
  });
}

export function useRsvpEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'accepted' | 'declined' | 'tentative' }) =>
      communicationHubService.rsvpEvent(eventId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication-hub', 'calendar'] }),
  });
}
