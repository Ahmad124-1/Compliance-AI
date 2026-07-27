import { esgApi } from './api.js';

export const esgService = {
  listFrameworks: (params?: Record<string, unknown>) => esgApi.frameworks.list(params),
  getFramework: (id: string) => esgApi.frameworks.get(id),
  createFramework: (input: Record<string, unknown>) => esgApi.frameworks.create(input),
  updateFramework: (id: string, input: Record<string, unknown>) => esgApi.frameworks.update(id, input),
  deleteFramework: (id: string) => esgApi.frameworks.delete(id),
  listFrameworkMetrics: (frameworkId: string) => esgApi.metrics.listByFramework(frameworkId),

  listMetrics: (params?: Record<string, unknown>) => esgApi.metrics.list(params),
  getMetric: (id: string) => esgApi.metrics.get(id),
  createMetric: (input: Record<string, unknown>) => esgApi.metrics.create(input),
  updateMetric: (id: string, input: Record<string, unknown>) => esgApi.metrics.update(id, input),
  deleteMetric: (id: string) => esgApi.metrics.delete(id),

  listPeriods: (params?: Record<string, unknown>) => esgApi.periods.list(params),
  getPeriod: (id: string) => esgApi.periods.get(id),
  createPeriod: (input: Record<string, unknown>) => esgApi.periods.create(input),
  updatePeriod: (id: string, input: Record<string, unknown>) => esgApi.periods.update(id, input),
  deletePeriod: (id: string) => esgApi.periods.delete(id),

  listDataPoints: (params?: Record<string, unknown>) => esgApi.dataPoints.list(params),
  getDataPoint: (id: string) => esgApi.dataPoints.get(id),
  createDataPoint: (input: Record<string, unknown>) => esgApi.dataPoints.create(input),
  updateDataPoint: (id: string, input: Record<string, unknown>) => esgApi.dataPoints.update(id, input),
  verifyDataPoint: (id: string) => esgApi.dataPoints.verify(id),
  deleteDataPoint: (id: string) => esgApi.dataPoints.delete(id),

  listMaterialityTopics: (params?: Record<string, unknown>) => esgApi.materiality.topics.list(params),
  getMaterialityTopic: (id: string) => esgApi.materiality.topics.get(id),
  createMaterialityTopic: (input: Record<string, unknown>) => esgApi.materiality.topics.create(input),
  updateMaterialityTopic: (id: string, input: Record<string, unknown>) => esgApi.materiality.topics.update(id, input),
  deleteMaterialityTopic: (id: string) => esgApi.materiality.topics.delete(id),

  listMaterialityAssessments: (params?: Record<string, unknown>) => esgApi.materiality.assessments.list(params),
  getMaterialityAssessment: (id: string) => esgApi.materiality.assessments.get(id),
  createMaterialityAssessment: (input: Record<string, unknown>) => esgApi.materiality.assessments.create(input),
  updateMaterialityAssessment: (id: string, input: Record<string, unknown>) => esgApi.materiality.assessments.update(id, input),
  listPeriodAssessments: (periodId: string) => esgApi.materiality.assessments.listByPeriod(periodId),

  listDisclosures: (params?: Record<string, unknown>) => esgApi.disclosures.list(params),
  getDisclosure: (id: string) => esgApi.disclosures.get(id),
  createDisclosure: (input: Record<string, unknown>) => esgApi.disclosures.create(input),
  updateDisclosure: (id: string, input: Record<string, unknown>) => esgApi.disclosures.update(id, input),
  deleteDisclosure: (id: string) => esgApi.disclosures.delete(id),

  listReports: (params?: Record<string, unknown>) => esgApi.reports.list(params),
  getReport: (id: string) => esgApi.reports.get(id),
  createReport: (input: Record<string, unknown>) => esgApi.reports.create(input),
  updateReport: (id: string, input: Record<string, unknown>) => esgApi.reports.update(id, input),
  deleteReport: (id: string) => esgApi.reports.delete(id),

  listAssurance: (params?: Record<string, unknown>) => esgApi.assurance.list(params),
  getAssurance: (id: string) => esgApi.assurance.get(id),
  createAssurance: (input: Record<string, unknown>) => esgApi.assurance.create(input),
  updateAssurance: (id: string, input: Record<string, unknown>) => esgApi.assurance.update(id, input),
  deleteAssurance: (id: string) => esgApi.assurance.delete(id),
};
