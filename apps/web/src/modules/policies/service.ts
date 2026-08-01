import { policiesApi } from './api.js';

export const policiesService = {
  listPolicies: (params?: Record<string, unknown>) => policiesApi.list(params),
  getPolicy: (id: string) => policiesApi.get(id),
  generatePolicy: (type: string, context?: Record<string, unknown>) => policiesApi.generate({ type, context }),
  updatePolicy: (id: string, patch: Record<string, unknown>) => policiesApi.update(id, patch),
  approvePolicy: (id: string) => policiesApi.approve(id),
  rejectPolicy: (id: string, reason?: string) => policiesApi.reject(id, reason),
  exportPolicy: (id: string, format?: string) => policiesApi.export(id, format),
};

