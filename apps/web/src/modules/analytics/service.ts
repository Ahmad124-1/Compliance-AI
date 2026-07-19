import { analyticsApi } from './api.js';

export const analyticsService = {
  kpis: (params?: { dateFrom?: string; dateTo?: string }) => analyticsApi.kpis(params),
  caseAnalytics: (params?: { dateFrom?: string; dateTo?: string; siteId?: string; departmentId?: string }) =>
    analyticsApi.caseAnalytics(params),
  communicationAnalytics: (params?: { dateFrom?: string; dateTo?: string }) => analyticsApi.communicationAnalytics(params),
  slaAnalytics: (params?: { dateFrom?: string; dateTo?: string }) => analyticsApi.slaAnalytics(params),
  escalationAnalytics: () => analyticsApi.escalationAnalytics(),
  qrAnalytics: (params?: { qrCodeId?: string; dateFrom?: string; dateTo?: string }) => analyticsApi.qrAnalytics(params),
  trends: (metric?: string, period?: string) => analyticsApi.trends(metric, period),
  heatmap: (metric?: string) => analyticsApi.heatmap(metric),
  refresh: (date?: string) => analyticsApi.refresh(date),
};
