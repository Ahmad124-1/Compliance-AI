import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ESG_ENDPOINTS } from './constants.js';
import type {
  EsgFramework,
  EsgMetric,
  EsgReportingPeriod,
  EsgDataPoint,
  EsgMaterialityTopic,
  EsgMaterialityAssessment,
  EsgDisclosure,
  EsgReport,
  EsgAssurance,
  EsgDashboard,
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

export const esgApi = {
  frameworks: {
    list: (params?: Record<string, unknown>) =>
      http<{ frameworks: EsgFramework[]; total: number }>(addParams(ESG_ENDPOINTS.frameworks, params)),
    get: (id: string) => http<EsgFramework>(`${ESG_ENDPOINTS.frameworks}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgFramework>(ESG_ENDPOINTS.frameworks, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgFramework>(`${ESG_ENDPOINTS.frameworks}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.frameworks}/${id}`, { method: 'DELETE' }),
  },
  metrics: {
    list: (params?: Record<string, unknown>) =>
      http<{ metrics: EsgMetric[]; total: number }>(addParams(ESG_ENDPOINTS.metrics, params)),
    get: (id: string) => http<EsgMetric>(`${ESG_ENDPOINTS.metrics}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgMetric>(ESG_ENDPOINTS.metrics, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgMetric>(`${ESG_ENDPOINTS.metrics}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.metrics}/${id}`, { method: 'DELETE' }),
    listByFramework: (frameworkId: string) =>
      http<EsgMetric[]>(ESG_ENDPOINTS.frameworkMetrics(frameworkId)),
  },
  periods: {
    list: (params?: Record<string, unknown>) =>
      http<{ periods: EsgReportingPeriod[]; total: number }>(addParams(ESG_ENDPOINTS.periods, params)),
    get: (id: string) => http<EsgReportingPeriod>(`${ESG_ENDPOINTS.periods}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgReportingPeriod>(ESG_ENDPOINTS.periods, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgReportingPeriod>(`${ESG_ENDPOINTS.periods}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.periods}/${id}`, { method: 'DELETE' }),
  },
  dataPoints: {
    list: (params?: Record<string, unknown>) =>
      http<{ dataPoints: EsgDataPoint[]; total: number }>(addParams(ESG_ENDPOINTS.dataPoints, params)),
    get: (id: string) => http<EsgDataPoint>(`${ESG_ENDPOINTS.dataPoints}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgDataPoint>(ESG_ENDPOINTS.dataPoints, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgDataPoint>(`${ESG_ENDPOINTS.dataPoints}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    verify: (id: string) =>
      http<EsgDataPoint>(`${ESG_ENDPOINTS.dataPoints}/${id}/verify`, { method: 'POST' }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.dataPoints}/${id}`, { method: 'DELETE' }),
  },
  materiality: {
    topics: {
      list: (params?: Record<string, unknown>) =>
        http<{ topics: EsgMaterialityTopic[]; total: number }>(addParams(ESG_ENDPOINTS.materialityTopics, params)),
      get: (id: string) => http<EsgMaterialityTopic>(`${ESG_ENDPOINTS.materialityTopics}/${id}`),
      create: (input: Record<string, unknown>) =>
        http<EsgMaterialityTopic>(ESG_ENDPOINTS.materialityTopics, { method: 'POST', body: JSON.stringify(input) }),
      update: (id: string, input: Record<string, unknown>) =>
        http<EsgMaterialityTopic>(`${ESG_ENDPOINTS.materialityTopics}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      delete: (id: string) =>
        http<{ success: boolean }>(`${ESG_ENDPOINTS.materialityTopics}/${id}`, { method: 'DELETE' }),
    },
    assessments: {
      list: (params?: Record<string, unknown>) =>
        http<{ assessments: EsgMaterialityAssessment[]; total: number }>(addParams(ESG_ENDPOINTS.materialityAssessments, params)),
      get: (id: string) => http<EsgMaterialityAssessment>(`${ESG_ENDPOINTS.materialityAssessments}/${id}`),
      create: (input: Record<string, unknown>) =>
        http<EsgMaterialityAssessment>(ESG_ENDPOINTS.materialityAssessments, { method: 'POST', body: JSON.stringify(input) }),
      update: (id: string, input: Record<string, unknown>) =>
        http<EsgMaterialityAssessment>(`${ESG_ENDPOINTS.materialityAssessments}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      listByPeriod: (periodId: string) =>
        http<EsgMaterialityAssessment[]>(ESG_ENDPOINTS.periodAssessments(periodId)),
    },
  },
  disclosures: {
    list: (params?: Record<string, unknown>) =>
      http<{ disclosures: EsgDisclosure[]; total: number }>(addParams(ESG_ENDPOINTS.disclosures, params)),
    get: (id: string) => http<EsgDisclosure>(`${ESG_ENDPOINTS.disclosures}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgDisclosure>(ESG_ENDPOINTS.disclosures, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgDisclosure>(`${ESG_ENDPOINTS.disclosures}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.disclosures}/${id}`, { method: 'DELETE' }),
  },
  reports: {
    list: (params?: Record<string, unknown>) =>
      http<{ reports: EsgReport[]; total: number }>(addParams(ESG_ENDPOINTS.reports, params)),
    get: (id: string) => http<EsgReport>(`${ESG_ENDPOINTS.reports}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgReport>(ESG_ENDPOINTS.reports, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgReport>(`${ESG_ENDPOINTS.reports}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.reports}/${id}`, { method: 'DELETE' }),
  },
  assurance: {
    list: (params?: Record<string, unknown>) =>
      http<{ assurances: EsgAssurance[]; total: number }>(addParams(ESG_ENDPOINTS.assurance, params)),
    get: (id: string) => http<EsgAssurance>(`${ESG_ENDPOINTS.assurance}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EsgAssurance>(ESG_ENDPOINTS.assurance, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EsgAssurance>(`${ESG_ENDPOINTS.assurance}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${ESG_ENDPOINTS.assurance}/${id}`, { method: 'DELETE' }),
  },
};
