import { environmentApi } from './api.js';

export const environmentService = {
  getDashboard: () => environmentApi.dashboard.get(),

  listWater: (params?: Record<string, unknown>) => environmentApi.water.list(params),
  getWater: (id: string) => environmentApi.water.get(id),
  createWater: (input: Record<string, unknown>) => environmentApi.water.create(input),
  updateWater: (id: string, input: Record<string, unknown>) => environmentApi.water.update(id, input),
  deleteWater: (id: string) => environmentApi.water.delete(id),

  listWaste: (params?: Record<string, unknown>) => environmentApi.waste.list(params),
  getWaste: (id: string) => environmentApi.waste.get(id),
  createWaste: (input: Record<string, unknown>) => environmentApi.waste.create(input),
  updateWaste: (id: string, input: Record<string, unknown>) => environmentApi.waste.update(id, input),
  deleteWaste: (id: string) => environmentApi.waste.delete(id),

  listAir: (params?: Record<string, unknown>) => environmentApi.air.list(params),
  getAir: (id: string) => environmentApi.air.get(id),
  createAir: (input: Record<string, unknown>) => environmentApi.air.create(input),
  updateAir: (id: string, input: Record<string, unknown>) => environmentApi.air.update(id, input),
  deleteAir: (id: string) => environmentApi.air.delete(id),

  listChemicals: (params?: Record<string, unknown>) => environmentApi.chemicals.list(params),
  getChemical: (id: string) => environmentApi.chemicals.get(id),
  createChemical: (input: Record<string, unknown>) => environmentApi.chemicals.create(input),
  updateChemical: (id: string, input: Record<string, unknown>) => environmentApi.chemicals.update(id, input),
  deleteChemical: (id: string) => environmentApi.chemicals.delete(id),

  listIncidents: (params?: Record<string, unknown>) => environmentApi.incidents.list(params),
  getIncident: (id: string) => environmentApi.incidents.get(id),
  createIncident: (input: Record<string, unknown>) => environmentApi.incidents.create(input),
  updateIncident: (id: string, input: Record<string, unknown>) => environmentApi.incidents.update(id, input),
  deleteIncident: (id: string) => environmentApi.incidents.delete(id),

  listRisks: (params?: Record<string, unknown>) => environmentApi.risks.list(params),
  getRisk: (id: string) => environmentApi.risks.get(id),
  createRisk: (input: Record<string, unknown>) => environmentApi.risks.create(input),
  updateRisk: (id: string, input: Record<string, unknown>) => environmentApi.risks.update(id, input),
  deleteRisk: (id: string) => environmentApi.risks.delete(id),

  listPermits: (params?: Record<string, unknown>) => environmentApi.permits.list(params),
  getPermit: (id: string) => environmentApi.permits.get(id),
  createPermit: (input: Record<string, unknown>) => environmentApi.permits.create(input),
  updatePermit: (id: string, input: Record<string, unknown>) => environmentApi.permits.update(id, input),
  deletePermit: (id: string) => environmentApi.permits.delete(id),

  listResources: (params?: Record<string, unknown>) => environmentApi.resources.list(params),
  getResource: (id: string) => environmentApi.resources.get(id),
  createResource: (input: Record<string, unknown>) => environmentApi.resources.create(input),
  updateResource: (id: string, input: Record<string, unknown>) => environmentApi.resources.update(id, input),
  deleteResource: (id: string) => environmentApi.resources.delete(id),

  listProjects: (params?: Record<string, unknown>) => environmentApi.projects.list(params),
  getProject: (id: string) => environmentApi.projects.get(id),
  createProject: (input: Record<string, unknown>) => environmentApi.projects.create(input),
  updateProject: (id: string, input: Record<string, unknown>) => environmentApi.projects.update(id, input),
  deleteProject: (id: string) => environmentApi.projects.delete(id),
};
