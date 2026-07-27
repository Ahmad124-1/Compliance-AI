import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUPPLIER_ESG_ENDPOINTS } from './constants.js';
import type { AssessmentRecord, AssessmentSummary, AssessmentAnswer, AssessmentQuestion } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function addParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  }
  const query = qs.toString();
  return query ? `${url}?${query}` : url;
}

export const supplierEsgApi = {
  assessments: {
    list: (params?: Record<string, unknown>) => http<{ assessments: AssessmentRecord[]; total: number }>(addParams(SUPPLIER_ESG_ENDPOINTS.assessments, params)),
    get: (id: string) => http<AssessmentRecord>(SUPPLIER_ESG_ENDPOINTS.assessment(id)),
    create: (input: Record<string, unknown>) => http<AssessmentRecord>(SUPPLIER_ESG_ENDPOINTS.assessments, { method: 'POST', body: JSON.stringify(input) }),
    submit: (id: string, answers: AssessmentAnswer[]) => http<AssessmentRecord>(SUPPLIER_ESG_ENDPOINTS.assessmentSubmit(id), { method: 'POST', body: JSON.stringify({ answers }) }),
    review: (id: string, action: string, reviewerId?: string, reviewerName?: string, notes?: string) => http<AssessmentRecord>(SUPPLIER_ESG_ENDPOINTS.assessmentReview(id), { method: 'POST', body: JSON.stringify({ action, reviewerId, reviewerName, notes }) }),
    delete: (id: string) => http<{ success: boolean }>(SUPPLIER_ESG_ENDPOINTS.assessment(id), { method: 'DELETE' }),
  },
  summary: {
    get: (supplierId: string) => http<{ total: number; byCategory: Record<string, number>; avgOverallScore: number; byStatus: Record<string, number> }>(`/api/v1/suppliers/${supplierId}/assessments/summary`),
  },
};