import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUSTAINABILITY_ENDPOINTS } from './constants.js';
import type {
  SustainabilityProgram,
  EsgGoal,
  SustainabilityKpi,
  KpiMeasurement,
  SustainabilityInitiative,
  InitiativeMilestone,
  SdgMapping,
  SustainabilityEvidence,
  SustainabilityApproval,
  SustainabilityReport,
  SustainabilityDashboard,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function addParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.append(key, String(value));
  }
  const query = qs.toString();
  return query ? `${url}?${query}` : url;
}

export const sustainabilityApi = {
  programs: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityProgram[]>(addParams(SUSTAINABILITY_ENDPOINTS.programs, params)),
    get: (id: string) => http<SustainabilityProgram>(`${SUSTAINABILITY_ENDPOINTS.programs}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityProgram>(SUSTAINABILITY_ENDPOINTS.programs, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityProgram>(`${SUSTAINABILITY_ENDPOINTS.programs}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.programs}/${id}`, { method: 'DELETE' }),
  },
  goals: {
    list: (params?: Record<string, unknown>) =>
      http<EsgGoal[]>(addParams(SUSTAINABILITY_ENDPOINTS.goals, params)),
    get: (id: string) => http<EsgGoal>(`${SUSTAINABILITY_ENDPOINTS.goals}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgGoal>(SUSTAINABILITY_ENDPOINTS.goals, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgGoal>(`${SUSTAINABILITY_ENDPOINTS.goals}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.goals}/${id}`, { method: 'DELETE' }),
    progress: () => http<{ completed: number; inProgress: number; total: number }>(`${SUSTAINABILITY_ENDPOINTS.goals}/progress`),
  },
  kpis: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityKpi[]>(addParams(SUSTAINABILITY_ENDPOINTS.kpis, params)),
    get: (id: string) => http<SustainabilityKpi>(`${SUSTAINABILITY_ENDPOINTS.kpis}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityKpi>(SUSTAINABILITY_ENDPOINTS.kpis, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityKpi>(`${SUSTAINABILITY_ENDPOINTS.kpis}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.kpis}/${id}`, { method: 'DELETE' }),
    recordMeasurement: (kpiId: string, input: Record<string, unknown>) =>
      http<KpiMeasurement>(`${SUSTAINABILITY_ENDPOINTS.kpis}/${kpiId}/measurements`, { method: 'POST', body: JSON.stringify(input) }),
    getMeasurements: (kpiId: string, params?: Record<string, unknown>) =>
      http<KpiMeasurement[]>(addParams(`${SUSTAINABILITY_ENDPOINTS.measurements}/${kpiId}`, params)),
    getTrend: (kpiId: string, params?: Record<string, unknown>) =>
      http<KpiMeasurement[]>(addParams(`${SUSTAINABILITY_ENDPOINTS.kpis}/${kpiId}/trend`, params)),
    getAggregated: (kpiId: string, params?: Record<string, unknown>) =>
      http<{ period: string; value: number }[]>(addParams(`${SUSTAINABILITY_ENDPOINTS.kpis}/${kpiId}/aggregated`, params)),
  },
  initiatives: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityInitiative[]>(addParams(SUSTAINABILITY_ENDPOINTS.initiatives, params)),
    get: (id: string) => http<SustainabilityInitiative>(`${SUSTAINABILITY_ENDPOINTS.initiatives}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityInitiative>(SUSTAINABILITY_ENDPOINTS.initiatives, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityInitiative>(`${SUSTAINABILITY_ENDPOINTS.initiatives}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.initiatives}/${id}`, { method: 'DELETE' }),
  },
  milestones: {
    create: (input: Record<string, unknown>) =>
      http<InitiativeMilestone>(SUSTAINABILITY_ENDPOINTS.milestones, { method: 'POST', body: JSON.stringify(input) }),
    listByInitiative: (initiativeId: string) =>
      http<InitiativeMilestone[]>(`${SUSTAINABILITY_ENDPOINTS.initiatives}/${initiativeId}/milestones`),
    update: (id: string, input: Record<string, unknown>) =>
      http<InitiativeMilestone>(`${SUSTAINABILITY_ENDPOINTS.milestones}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.milestones}/${id}`, { method: 'DELETE' }),
  },
  sdgs: {
    list: (params?: Record<string, unknown>) =>
      http<SdgMapping[]>(addParams(SUSTAINABILITY_ENDPOINTS.sdgs, params)),
    listByEntity: (entityType: string, entityId: string) =>
      http<SdgMapping[]>(addParams(SUSTAINABILITY_ENDPOINTS.sdgs, { entityType, entityId })),
    constants: () => http<{ sdgs: { id: number; name: string }[] }>(`${SUSTAINABILITY_ENDPOINTS.sdgs}/constants`),
    contribution: () => http<Record<number, number>>(SUSTAINABILITY_ENDPOINTS.sdgs + '/contribution'),
    create: (input: Record<string, unknown>) =>
      http<SdgMapping>(SUSTAINABILITY_ENDPOINTS.sdgs, { method: 'POST', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.sdgs}/${id}`, { method: 'DELETE' }),
  },
  evidence: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityEvidence[]>(addParams(SUSTAINABILITY_ENDPOINTS.evidence, params)),
    listByEntity: (entityType: string, entityId: string) =>
      http<SustainabilityEvidence[]>(addParams(SUSTAINABILITY_ENDPOINTS.evidence, { entityType, entityId })),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityEvidence>(SUSTAINABILITY_ENDPOINTS.evidence, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityEvidence>(`${SUSTAINABILITY_ENDPOINTS.evidence}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.evidence}/${id}`, { method: 'DELETE' }),
  },
  approvals: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityApproval[]>(addParams(SUSTAINABILITY_ENDPOINTS.approvals, params)),
    listByEntity: (entityType: string, entityId: string) =>
      http<SustainabilityApproval[]>(`${SUSTAINABILITY_ENDPOINTS.approvals}/${entityType}/${entityId}`),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityApproval>(SUSTAINABILITY_ENDPOINTS.approvals, { method: 'POST', body: JSON.stringify(input) }),
    transition: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityApproval>(`${SUSTAINABILITY_ENDPOINTS.approvals}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.approvals}/${id}`, { method: 'DELETE' }),
  },
  reports: {
    list: (params?: Record<string, unknown>) =>
      http<SustainabilityReport[]>(addParams(SUSTAINABILITY_ENDPOINTS.reports, params)),
    get: (id: string) => http<SustainabilityReport>(`${SUSTAINABILITY_ENDPOINTS.reports}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<SustainabilityReport>(SUSTAINABILITY_ENDPOINTS.reports, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<SustainabilityReport>(`${SUSTAINABILITY_ENDPOINTS.reports}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${SUSTAINABILITY_ENDPOINTS.reports}/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    dashboard: () => http<SustainabilityDashboard>(`${SUSTAINABILITY_ENDPOINTS.analytics}/dashboard`),
    programProgress: (programId: string) => http<unknown>(`${SUSTAINABILITY_ENDPOINTS.analytics}/progress/${programId}`),
    goalCompletion: () => http<{ completed: number; inProgress: number; total: number }>(`${SUSTAINABILITY_ENDPOINTS.analytics}/goal-completion`),
    kpiTrends: (kpiId: string, params?: Record<string, unknown>) =>
      http<KpiMeasurement[]>(addParams(`${SUSTAINABILITY_ENDPOINTS.analytics}/kpi-trends`, { kpiId, ...params })),
    initiativePerformance: () => http<SustainabilityInitiative[]>(`${SUSTAINABILITY_ENDPOINTS.analytics}/initiatives`),
    departmentComparison: () => http<Record<string, { avg: number; count: number }>>(`${SUSTAINABILITY_ENDPOINTS.analytics}/department-comparison`),
    esgPillarDistribution: () => http<Record<string, number>>(`${SUSTAINABILITY_ENDPOINTS.analytics}/esg-pillar-distribution`),
    sdgContribution: () => http<Record<number, number>>(`${SUSTAINABILITY_ENDPOINTS.analytics}/sdg-contribution`),
  },
};