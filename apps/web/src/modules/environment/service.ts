import { environmentApi } from './api.js';

export const environmentService = {
  getDashboard: () => environmentApi.dashboard.get(),

  // Water
  listWater: (params?: Record<string, unknown>) => environmentApi.water.list(params),
  getWater: (id: string) => environmentApi.water.get(id),
  createWater: (input: Record<string, unknown>) => environmentApi.water.create(input),
  updateWater: (id: string, input: Record<string, unknown>) => environmentApi.water.update(id, input),
  deleteWater: (id: string) => environmentApi.water.delete(id),
  listWaterTargets: (params?: Record<string, unknown>) => environmentApi.water.listTargets(params),
  getWaterTarget: (id: string) => environmentApi.water.getTarget(id),
  createWaterTarget: (input: Record<string, unknown>) => environmentApi.water.createTarget(input),
  updateWaterTarget: (id: string, input: Record<string, unknown>) => environmentApi.water.updateTarget(id, input),
  deleteWaterTarget: (id: string) => environmentApi.water.deleteTarget(id),
  getWaterKpis: (params?: Record<string, unknown>) => environmentApi.water.getKpis(params),

  // Waste
  listWaste: (params?: Record<string, unknown>) => environmentApi.waste.list(params),
  getWaste: (id: string) => environmentApi.waste.get(id),
  createWaste: (input: Record<string, unknown>) => environmentApi.waste.create(input),
  updateWaste: (id: string, input: Record<string, unknown>) => environmentApi.waste.update(id, input),
  deleteWaste: (id: string) => environmentApi.waste.delete(id),
  listWasteVendors: (params?: Record<string, unknown>) => environmentApi.waste.listVendors(params),
  getWasteVendor: (id: string) => environmentApi.waste.getVendor(id),
  createWasteVendor: (input: Record<string, unknown>) => environmentApi.waste.createVendor(input),
  updateWasteVendor: (id: string, input: Record<string, unknown>) => environmentApi.waste.updateVendor(id, input),
  deleteWasteVendor: (id: string) => environmentApi.waste.deleteVendor(id),
  listWasteTargets: (params?: Record<string, unknown>) => environmentApi.waste.listTargets(params),
  getWasteTarget: (id: string) => environmentApi.waste.getTarget(id),
  createWasteTarget: (input: Record<string, unknown>) => environmentApi.waste.createTarget(input),
  updateWasteTarget: (id: string, input: Record<string, unknown>) => environmentApi.waste.updateTarget(id, input),
  deleteWasteTarget: (id: string) => environmentApi.waste.deleteTarget(id),
  getWasteKpis: (params?: Record<string, unknown>) => environmentApi.waste.getKpis(params),

  // Air
  listAir: (params?: Record<string, unknown>) => environmentApi.air.list(params),
  getAir: (id: string) => environmentApi.air.get(id),
  createAir: (input: Record<string, unknown>) => environmentApi.air.create(input),
  updateAir: (id: string, input: Record<string, unknown>) => environmentApi.air.update(id, input),
  deleteAir: (id: string) => environmentApi.air.delete(id),
  listAirLimits: (params?: Record<string, unknown>) => environmentApi.air.listLimits(params),
  getAirLimit: (id: string) => environmentApi.air.getLimit(id),
  createAirLimit: (input: Record<string, unknown>) => environmentApi.air.createLimit(input),
  updateAirLimit: (id: string, input: Record<string, unknown>) => environmentApi.air.updateLimit(id, input),
  deleteAirLimit: (id: string) => environmentApi.air.deleteLimit(id),
  getAirKpis: (params?: Record<string, unknown>) => environmentApi.air.getKpis(params),

  // Chemicals
  listChemicals: (params?: Record<string, unknown>) => environmentApi.chemicals.list(params),
  getChemical: (id: string) => environmentApi.chemicals.get(id),
  createChemical: (input: Record<string, unknown>) => environmentApi.chemicals.create(input),
  updateChemical: (id: string, input: Record<string, unknown>) => environmentApi.chemicals.update(id, input),
  deleteChemical: (id: string) => environmentApi.chemicals.delete(id),
  listChemicalContainers: (params?: Record<string, unknown>) => environmentApi.chemicals.listContainers(params),
  getChemicalContainer: (id: string) => environmentApi.chemicals.getContainer(id),
  createChemicalContainer: (input: Record<string, unknown>) => environmentApi.chemicals.createContainer(input),
  updateChemicalContainer: (id: string, input: Record<string, unknown>) => environmentApi.chemicals.updateContainer(id, input),
  deleteChemicalContainer: (id: string) => environmentApi.chemicals.deleteContainer(id),
  listChemicalSpills: (params?: Record<string, unknown>) => environmentApi.chemicals.listSpills(params),
  getChemicalSpill: (id: string) => environmentApi.chemicals.getSpill(id),
  createChemicalSpill: (input: Record<string, unknown>) => environmentApi.chemicals.createSpill(input),
  updateChemicalSpill: (id: string, input: Record<string, unknown>) => environmentApi.chemicals.updateSpill(id, input),
  deleteChemicalSpill: (id: string) => environmentApi.chemicals.deleteSpill(id),

  // Incidents
  listIncidents: (params?: Record<string, unknown>) => environmentApi.incidents.list(params),
  getIncident: (id: string) => environmentApi.incidents.get(id),
  createIncident: (input: Record<string, unknown>) => environmentApi.incidents.create(input),
  updateIncident: (id: string, input: Record<string, unknown>) => environmentApi.incidents.update(id, input),
  deleteIncident: (id: string) => environmentApi.incidents.delete(id),

  // Risks
  listRisks: (params?: Record<string, unknown>) => environmentApi.risks.list(params),
  getRisk: (id: string) => environmentApi.risks.get(id),
  createRisk: (input: Record<string, unknown>) => environmentApi.risks.create(input),
  updateRisk: (id: string, input: Record<string, unknown>) => environmentApi.risks.update(id, input),
  deleteRisk: (id: string) => environmentApi.risks.delete(id),

  // Permits
  listPermits: (params?: Record<string, unknown>) => environmentApi.permits.list(params),
  getPermit: (id: string) => environmentApi.permits.get(id),
  createPermit: (input: Record<string, unknown>) => environmentApi.permits.create(input),
  updatePermit: (id: string, input: Record<string, unknown>) => environmentApi.permits.update(id, input),
  deletePermit: (id: string) => environmentApi.permits.delete(id),
  getUpcomingRenewals: (days?: number) => environmentApi.permits.getUpcomingRenewals(days),
  getExpiredPermits: () => environmentApi.permits.getExpired(),

  // Resources
  listResources: (params?: Record<string, unknown>) => environmentApi.resources.list(params),
  getResource: (id: string) => environmentApi.resources.get(id),
  createResource: (input: Record<string, unknown>) => environmentApi.resources.create(input),
  updateResource: (id: string, input: Record<string, unknown>) => environmentApi.resources.update(id, input),
  deleteResource: (id: string) => environmentApi.resources.delete(id),

  // Projects
  listProjects: (params?: Record<string, unknown>) => environmentApi.projects.list(params),
  getProject: (id: string) => environmentApi.projects.get(id),
  createProject: (input: Record<string, unknown>) => environmentApi.projects.create(input),
  updateProject: (id: string, input: Record<string, unknown>) => environmentApi.projects.update(id, input),
  deleteProject: (id: string) => environmentApi.projects.delete(id),

  // Biodiversity
  listBiodiversity: (params?: Record<string, unknown>) => environmentApi.biodiversity.list(params),
  getBiodiversity: (id: string) => environmentApi.biodiversity.get(id),
  createBiodiversity: (input: Record<string, unknown>) => environmentApi.biodiversity.create(input),
  updateBiodiversity: (id: string, input: Record<string, unknown>) => environmentApi.biodiversity.update(id, input),
  deleteBiodiversity: (id: string) => environmentApi.biodiversity.delete(id),
  getBiodiversityKpis: () => environmentApi.biodiversity.getKpis(),

  // Objectives
  listObjectives: (params?: Record<string, unknown>) => environmentApi.objectives.list(params),
  getObjective: (id: string) => environmentApi.objectives.get(id),
  createObjective: (input: Record<string, unknown>) => environmentApi.objectives.create(input),
  updateObjective: (id: string, input: Record<string, unknown>) => environmentApi.objectives.update(id, input),
  deleteObjective: (id: string) => environmentApi.objectives.delete(id),
  listObjectiveMilestones: (objectiveId: string) => environmentApi.objectives.listMilestones(objectiveId),
  createObjectiveMilestone: (objectiveId: string, input: Record<string, unknown>) => environmentApi.objectives.createMilestone(objectiveId, input),
  updateObjectiveMilestone: (id: string, input: Record<string, unknown>) => environmentApi.objectives.updateMilestone(id, input),
  deleteObjectiveMilestone: (id: string) => environmentApi.objectives.deleteMilestone(id),

  // Reports
  listReports: (params?: Record<string, unknown>) => environmentApi.reports.list(params),
  getReport: (id: string) => environmentApi.reports.get(id),
  createReport: (input: Record<string, unknown>) => environmentApi.reports.create(input),
  generateReport: (input: Record<string, unknown>) => environmentApi.reports.generate(input),
  updateReport: (id: string, input: Record<string, unknown>) => environmentApi.reports.update(id, input),
  deleteReport: (id: string) => environmentApi.reports.delete(id),

  // AI
  getAiInsights: () => environmentApi.ai.getInsights(),
  getAiExecutiveSummary: () => environmentApi.ai.getExecutiveSummary(),
};
