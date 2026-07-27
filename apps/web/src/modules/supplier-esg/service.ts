import { supplierEsgApi } from './api.js';
import type { AssessmentAnswer } from './types.js';

export const supplierEsgService = {
  listAssessments: (params?: Record<string, unknown>) => supplierEsgApi.assessments.list(params),
  getAssessment: (id: string) => supplierEsgApi.assessments.get(id),
  createAssessment: (input: Record<string, unknown>) => supplierEsgApi.assessments.create(input),
  submitAssessment: (id: string, answers: AssessmentAnswer[]) => supplierEsgApi.assessments.submit(id, answers),
  reviewAssessment: (id: string, action: string, reviewerId?: string, reviewerName?: string, notes?: string) => supplierEsgApi.assessments.review(id, action, reviewerId, reviewerName, notes),
  deleteAssessment: (id: string) => supplierEsgApi.assessments.delete(id),
  getAssessmentSummary: (supplierId: string) => supplierEsgApi.summary.get(supplierId),
};