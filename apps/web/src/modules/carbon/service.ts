import { carbonApi } from './api.js';

export const carbonService = {
  listFacilities: (params?: Record<string, unknown>) => carbonApi.facilities.list(params),
  getFacility: (id: string) => carbonApi.facilities.get(id),
  createFacility: (input: Record<string, unknown>) => carbonApi.facilities.create(input),
  updateFacility: (id: string, input: Record<string, unknown>) => carbonApi.facilities.update(id, input),
  deleteFacility: (id: string) => carbonApi.facilities.delete(id),

  listEmissionSources: (params?: Record<string, unknown>) => carbonApi.emissionSources.list(params),
  getEmissionSource: (id: string) => carbonApi.emissionSources.get(id),
  createEmissionSource: (input: Record<string, unknown>) => carbonApi.emissionSources.create(input),
  updateEmissionSource: (id: string, input: Record<string, unknown>) => carbonApi.emissionSources.update(id, input),
  deleteEmissionSource: (id: string) => carbonApi.emissionSources.delete(id),

  listScopes: (params?: Record<string, unknown>) => carbonApi.scopes.list(params),
  getScope: (id: string) => carbonApi.scopes.get(id),
  createScope: (input: Record<string, unknown>) => carbonApi.scopes.create(input),
  updateScope: (id: string, input: Record<string, unknown>) => carbonApi.scopes.update(id, input),

  listEmissions: (params?: Record<string, unknown>) => carbonApi.emissions.list(params),
  getEmission: (id: string) => carbonApi.emissions.get(id),
  createEmission: (input: Record<string, unknown>) => carbonApi.emissions.create(input),
  updateEmission: (id: string, input: Record<string, unknown>) => carbonApi.emissions.update(id, input),
  deleteEmission: (id: string) => carbonApi.emissions.delete(id),

  listEmissionFactors: (params?: Record<string, unknown>) => carbonApi.emissionFactors.list(params),
  getEmissionFactor: (id: string) => carbonApi.emissionFactors.get(id),
  createEmissionFactor: (input: Record<string, unknown>) => carbonApi.emissionFactors.create(input),
  updateEmissionFactor: (id: string, input: Record<string, unknown>) => carbonApi.emissionFactors.update(id, input),

  listProjects: (params?: Record<string, unknown>) => carbonApi.projects.list(params),
  getProject: (id: string) => carbonApi.projects.get(id),
  createProject: (input: Record<string, unknown>) => carbonApi.projects.create(input),
  updateProject: (id: string, input: Record<string, unknown>) => carbonApi.projects.update(id, input),

  listOffsets: (params?: Record<string, unknown>) => carbonApi.offsets.list(params),
  getOffset: (id: string) => carbonApi.offsets.get(id),
  createOffset: (input: Record<string, unknown>) => carbonApi.offsets.create(input),
  updateOffset: (id: string, input: Record<string, unknown>) => carbonApi.offsets.update(id, input),

  listTargets: (params?: Record<string, unknown>) => carbonApi.targets.list(params),
  getTarget: (id: string) => carbonApi.targets.get(id),
  createTarget: (input: Record<string, unknown>) => carbonApi.targets.create(input),
  updateTarget: (id: string, input: Record<string, unknown>) => carbonApi.targets.update(id, input),

  listReports: (params?: Record<string, unknown>) => carbonApi.reports.list(params),
  getReport: (id: string) => carbonApi.reports.get(id),
  createReport: (input: Record<string, unknown>) => carbonApi.reports.create(input),
  updateReport: (id: string, input: Record<string, unknown>) => carbonApi.reports.update(id, input),

  getDashboard: () => carbonApi.dashboard.get(),
  calculateEmissions: (input: Record<string, unknown>) => carbonApi.calculate.calculate(input),
  listCalculations: (params?: Record<string, unknown>) => carbonApi.calculations.list(params),
};