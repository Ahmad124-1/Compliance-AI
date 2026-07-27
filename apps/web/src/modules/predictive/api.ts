import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export interface PredictionQuery {
  type?: string;
  category?: string;
  riskLevel?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePredictionInput {
  type: string;
  category: string;
  entityType: string;
  entityId?: string;
  title: string;
  description?: string;
  probability: number;
  confidenceScore: number;
  reasoning?: string;
  suggestedActions?: string[];
  riskLevel?: string;
  timeframe?: string;
  metadata?: Record<string, unknown>;
}

export interface RunScenarioInput {
  name: string;
  description?: string;
  scenarioType: string;
  parameters: Record<string, unknown>;
  createdBy?: string;
}

export interface GenerateRecommendationsInput {
  type: string;
  priority?: string;
  context?: Record<string, unknown>;
}

export const predictiveApi = {
  predictions: (query: PredictionQuery = {}) => {
    const params = new URLSearchParams();
    if (query.type) params.set('type', query.type);
    if (query.category) params.set('category', query.category);
    if (query.riskLevel) params.set('riskLevel', query.riskLevel);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.offset) params.set('offset', String(query.offset));
    const qs = params.toString();
    return http<{ predictions: any[]; total: number }>(`/predictions${qs ? `?${qs}` : ''}`);
  },

  createPrediction: (input: CreatePredictionInput) =>
    http<any>('/predictions', { method: 'POST', body: JSON.stringify(input) }),

  predictionStats: () =>
    http<{ total: number; byType: Record<string, number>; byRiskLevel: Record<string, number>; avgProbability: number; avgConfidence: number }>('/predictions/stats'),

  riskForecast: (timeframe?: string) => {
    const params = timeframe ? new URLSearchParams({ timeframe }) : undefined;
    return http<any[]>(`/risk/forecast${params ? `?${params.toString()}` : ''}`);
  },

  auditPrediction: (auditId?: string, departmentId?: string) => {
    const params = new URLSearchParams({ ...(auditId ? { auditId } : {}), ...(departmentId ? { departmentId } : {}) });
    return http<any>(`/risk/audit-prediction?${params.toString()}`);
  },

  trends: (metric?: string, period = 'month') => {
    const params = new URLSearchParams({ ...(metric ? { metric } : {}), period });
    return http<any[]>(`/trends?${params.toString()}`);
  },

  complianceTrends: () =>
    http<{ score: any[]; violations: any[]; training: any[]; audits: any[] }>('/trends'),

  departmentTrends: () =>
    http<any[]>('/trends/departments'),

  factoryComparison: () =>
    http<any[]>('/trends/factories'),

  runScenario: (input: RunScenarioInput) =>
    http<any>('/scenario', { method: 'POST', body: JSON.stringify(input) }),

  scenarios: () =>
    http<any[]>('/scenario'),

  generateRecommendations: (input: GenerateRecommendationsInput) =>
    http<any[]>('/recommendations', { method: 'POST', body: JSON.stringify(input) }),

  recommendations: (filters: { status?: string; priority?: string; type?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.type) params.set('type', filters.type);
    const qs = params.toString();
    return http<any[]>(`/recommendations${qs ? `?${qs}` : ''}`);
  },

  updateRecommendation: (id: string, status: string) =>
    http<any>(`/recommendations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  computeForecast: (metric: string, horizonDays?: number) =>
    http<any>('/forecast', { method: 'POST', body: JSON.stringify({ metric, horizonDays }) }),

  forecasts: (forecastType?: string) => {
    const params = forecastType ? new URLSearchParams({ forecastType }) : undefined;
    return http<any[]>(`/forecast${params ? `?${params.toString()}` : ''}`);
  },
};
