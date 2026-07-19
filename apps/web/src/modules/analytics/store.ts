'use client';

import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';

import { analyticsService } from './service.js';

interface AnalyticsUiState {
  dateFrom: string;
  dateTo: string;
  metric: string;
  period: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setMetric: (v: string) => void;
  setPeriod: (v: string) => void;
  reset: () => void;
}

export const useAnalyticsUiStore = create<AnalyticsUiState>((set) => ({
  dateFrom: '',
  dateTo: '',
  metric: 'cases',
  period: 'day',
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),
  setMetric: (v) => set({ metric: v }),
  setPeriod: (v) => set({ period: v }),
  reset: () => set({ dateFrom: '', dateTo: '', metric: 'cases', period: 'day' }),
}));

function d<T>(key: unknown[], fn: () => Promise<T>) {
  return {
    queryKey: key,
    queryFn: fn,
  };
}

export function useKpis(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery(d(['analytics', 'kpis', params ?? {}], () => analyticsService.kpis(params)));
}

export function useCaseAnalytics(params?: { dateFrom?: string; dateTo?: string; siteId?: string; departmentId?: string }) {
  return useQuery(d(['analytics', 'cases', params ?? {}], () => analyticsService.caseAnalytics(params)));
}

export function useCommunicationAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery(d(['analytics', 'communication', params ?? {}], () => analyticsService.communicationAnalytics(params)));
}

export function useSlaAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery(d(['analytics', 'sla', params ?? {}], () => analyticsService.slaAnalytics(params)));
}

export function useEscalationAnalytics() {
  return useQuery(d(['analytics', 'escalations'], () => analyticsService.escalationAnalytics()));
}

export function useQrAnalytics(params?: { qrCodeId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery(d(['analytics', 'qr', params ?? {}], () => analyticsService.qrAnalytics(params)));
}

export function useTrends(metric?: string, period?: string) {
  return useQuery(d(['analytics', 'trends', metric, period], () => analyticsService.trends(metric, period)));
}

export function useHeatmap(metric?: string) {
  return useQuery(d(['analytics', 'heatmap', metric], () => analyticsService.heatmap(metric)));
}
