import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ENVIRONMENT_ENDPOINTS } from './constants.js';
import type {
  WaterUsage, WasteRecord, AirEmission, Chemical, EnvironmentalIncident,
  EnvironmentalRisk, Permit, ResourceUsage, EnvironmentalProject, EnvironmentalDashboard,
  WaterTarget, WasteVendor, WasteTarget, AirEmissionLimit,
  ChemicalContainer, ChemicalSpill, BiodiversityRecord, BiodiversityKpis,
  EnvironmentalObjective, ObjectiveMilestone, EnvironmentalReport,
  WaterKpis, WasteKpis, AirKpis, EnvironmentalAiInsights, EnvironmentalExecutiveSummary,
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

export const environmentApi = {
  dashboard: {
    get: () => http<EnvironmentalDashboard>(ENVIRONMENT_ENDPOINTS.dashboard),
  },
  water: {
    list: (params?: Record<string, unknown>) => http<WaterUsage[]>(addParams(ENVIRONMENT_ENDPOINTS.water, params)),
    get: (id: string) => http<WaterUsage>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`),
    create: (input: Record<string, unknown>) => http<WaterUsage>(ENVIRONMENT_ENDPOINTS.water, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<WaterUsage>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`, { method: 'DELETE' }),
    // Targets
    listTargets: (params?: Record<string, unknown>) => http<WaterTarget[]>(addParams(ENVIRONMENT_ENDPOINTS.waterTargets, params)),
    getTarget: (id: string) => http<WaterTarget>(`${ENVIRONMENT_ENDPOINTS.waterTargets}/${id}`),
    createTarget: (input: Record<string, unknown>) => http<WaterTarget>(ENVIRONMENT_ENDPOINTS.waterTargets, { method: 'POST', body: JSON.stringify(input) }),
    updateTarget: (id: string, input: Record<string, unknown>) => http<WaterTarget>(`${ENVIRONMENT_ENDPOINTS.waterTargets}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteTarget: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.waterTargets}/${id}`, { method: 'DELETE' }),
    // KPIs
    getKpis: (params?: Record<string, unknown>) => http<WaterKpis>(addParams(ENVIRONMENT_ENDPOINTS.waterKpis, params)),
  },
  waste: {
    list: (params?: Record<string, unknown>) => http<WasteRecord[]>(addParams(ENVIRONMENT_ENDPOINTS.waste, params)),
    get: (id: string) => http<WasteRecord>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`),
    create: (input: Record<string, unknown>) => http<WasteRecord>(ENVIRONMENT_ENDPOINTS.waste, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<WasteRecord>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`, { method: 'DELETE' }),
// Vendors
    listVendors: (params?: Record<string, unknown>) => http<WasteVendor[]>(addParams(ENVIRONMENT_ENDPOINTS.wasteVendors, params)),
    getVendor: (id: string) => http<WasteVendor>(`${ENVIRONMENT_ENDPOINTS.wasteVendors}/${id}`),
    createVendor: (input: Record<string, unknown>) => http<WasteVendor>(ENVIRONMENT_ENDPOINTS.wasteVendors, { method: 'POST', body: JSON.stringify(input) }),
    updateVendor: (id: string, input: Record<string, unknown>) => http<WasteVendor>(`${ENVIRONMENT_ENDPOINTS.wasteVendors}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteVendor: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.wasteVendors}/${id}`, { method: 'DELETE' }),
    // Targets
    listTargets: (params?: Record<string, unknown>) => http<WasteTarget[]>(addParams(ENVIRONMENT_ENDPOINTS.wasteTargets, params)),
    getTarget: (id: string) => http<WasteTarget>(`${ENVIRONMENT_ENDPOINTS.wasteTargets}/${id}`),
    createTarget: (input: Record<string, unknown>) => http<WasteTarget>(ENVIRONMENT_ENDPOINTS.wasteTargets, { method: 'POST', body: JSON.stringify(input) }),
    updateTarget: (id: string, input: Record<string, unknown>) => http<WasteTarget>(`${ENVIRONMENT_ENDPOINTS.wasteTargets}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteTarget: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.wasteTargets}/${id}`, { method: 'DELETE' }),
    // KPIs
    getKpis: (params?: Record<string, unknown>) => http<WasteKpis>(addParams(ENVIRONMENT_ENDPOINTS.wasteKpis, params)),
  },
  air: {
    list: (params?: Record<string, unknown>) => http<AirEmission[]>(addParams(ENVIRONMENT_ENDPOINTS.air, params)),
    get: (id: string) => http<AirEmission>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`),
    create: (input: Record<string, unknown>) => http<AirEmission>(ENVIRONMENT_ENDPOINTS.air, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<AirEmission>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`, { method: 'DELETE' }),
    // Limits
    listLimits: (params?: Record<string, unknown>) => http<AirEmissionLimit[]>(addParams(ENVIRONMENT_ENDPOINTS.airLimits, params)),
    getLimit: (id: string) => http<AirEmissionLimit>(`${ENVIRONMENT_ENDPOINTS.airLimits}/${id}`),
    createLimit: (input: Record<string, unknown>) => http<AirEmissionLimit>(ENVIRONMENT_ENDPOINTS.airLimits, { method: 'POST', body: JSON.stringify(input) }),
    updateLimit: (id: string, input: Record<string, unknown>) => http<AirEmissionLimit>(`${ENVIRONMENT_ENDPOINTS.airLimits}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteLimit: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.airLimits}/${id}`, { method: 'DELETE' }),
    // KPIs
    getKpis: (params?: Record<string, unknown>) => http<AirKpis>(addParams(ENVIRONMENT_ENDPOINTS.airKpis, params)),
  },
  chemicals: {
    list: (params?: Record<string, unknown>) => http<Chemical[]>(addParams(ENVIRONMENT_ENDPOINTS.chemicals, params)),
    get: (id: string) => http<Chemical>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`),
    create: (input: Record<string, unknown>) => http<Chemical>(ENVIRONMENT_ENDPOINTS.chemicals, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<Chemical>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`, { method: 'DELETE' }),
    // Containers
    listContainers: (params?: Record<string, unknown>) => http<ChemicalContainer[]>(addParams(ENVIRONMENT_ENDPOINTS.chemicalContainers, params)),
    getContainer: (id: string) => http<ChemicalContainer>(`${ENVIRONMENT_ENDPOINTS.chemicalContainers}/${id}`),
    createContainer: (input: Record<string, unknown>) => http<ChemicalContainer>(ENVIRONMENT_ENDPOINTS.chemicalContainers, { method: 'POST', body: JSON.stringify(input) }),
    updateContainer: (id: string, input: Record<string, unknown>) => http<ChemicalContainer>(`${ENVIRONMENT_ENDPOINTS.chemicalContainers}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteContainer: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.chemicalContainers}/${id}`, { method: 'DELETE' }),
    // Spills
    listSpills: (params?: Record<string, unknown>) => http<ChemicalSpill[]>(addParams(ENVIRONMENT_ENDPOINTS.chemicalSpills, params)),
    getSpill: (id: string) => http<ChemicalSpill>(`${ENVIRONMENT_ENDPOINTS.chemicalSpills}/${id}`),
    createSpill: (input: Record<string, unknown>) => http<ChemicalSpill>(ENVIRONMENT_ENDPOINTS.chemicalSpills, { method: 'POST', body: JSON.stringify(input) }),
    updateSpill: (id: string, input: Record<string, unknown>) => http<ChemicalSpill>(`${ENVIRONMENT_ENDPOINTS.chemicalSpills}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteSpill: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.chemicalSpills}/${id}`, { method: 'DELETE' }),
  },
  incidents: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalIncident[]>(addParams(ENVIRONMENT_ENDPOINTS.incidents, params)),
    get: (id: string) => http<EnvironmentalIncident>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalIncident>(ENVIRONMENT_ENDPOINTS.incidents, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalIncident>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`, { method: 'DELETE' }),
  },
  risks: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalRisk[]>(addParams(ENVIRONMENT_ENDPOINTS.risks, params)),
    get: (id: string) => http<EnvironmentalRisk>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalRisk>(ENVIRONMENT_ENDPOINTS.risks, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalRisk>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`, { method: 'DELETE' }),
  },
  permits: {
    list: (params?: Record<string, unknown>) => http<Permit[]>(addParams(ENVIRONMENT_ENDPOINTS.permits, params)),
    get: (id: string) => http<Permit>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`),
    create: (input: Record<string, unknown>) => http<Permit>(ENVIRONMENT_ENDPOINTS.permits, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<Permit>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`, { method: 'DELETE' }),
    // Renewals
    getUpcomingRenewals: (days?: number) => http<Permit[]>(addParams(ENVIRONMENT_ENDPOINTS.permitsRenewals, { days })),
    getExpired: () => http<Permit[]>(ENVIRONMENT_ENDPOINTS.permitsExpired),
  },
  resources: {
    list: (params?: Record<string, unknown>) => http<ResourceUsage[]>(addParams(ENVIRONMENT_ENDPOINTS.resources, params)),
    get: (id: string) => http<ResourceUsage>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`),
    create: (input: Record<string, unknown>) => http<ResourceUsage>(ENVIRONMENT_ENDPOINTS.resources, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<ResourceUsage>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalProject[]>(addParams(ENVIRONMENT_ENDPOINTS.projects, params)),
    get: (id: string) => http<EnvironmentalProject>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalProject>(ENVIRONMENT_ENDPOINTS.projects, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalProject>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`, { method: 'DELETE' }),
  },
  // Biological Diversity
  biodiversity: {
    list: (params?: Record<string, unknown>) => http<BiodiversityRecord[]>(addParams(ENVIRONMENT_ENDPOINTS.biodiversity, params)),
    get: (id: string) => http<BiodiversityRecord>(`${ENVIRONMENT_ENDPOINTS.biodiversity}/${id}`),
    create: (input: Record<string, unknown>) => http<BiodiversityRecord>(ENVIRONMENT_ENDPOINTS.biodiversity, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<BiodiversityRecord>(`${ENVIRONMENT_ENDPOINTS.biodiversity}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.biodiversity}/${id}`, { method: 'DELETE' }),
    getKpis: () => http<BiodiversityKpis>(ENVIRONMENT_ENDPOINTS.biodiversityKpis),
  },
  // Environmental Objectives
  objectives: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalObjective[]>(addParams(ENVIRONMENT_ENDPOINTS.objectives, params)),
    get: (id: string) => http<EnvironmentalObjective>(`${ENVIRONMENT_ENDPOINTS.objectives}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalObjective>(ENVIRONMENT_ENDPOINTS.objectives, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalObjective>(`${ENVIRONMENT_ENDPOINTS.objectives}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.objectives}/${id}`, { method: 'DELETE' }),
    // Milestones
    listMilestones: (objectiveId: string) => http<ObjectiveMilestone[]>(`${ENVIRONMENT_ENDPOINTS.objectives}/${objectiveId}/milestones`),
    createMilestone: (objectiveId: string, input: Record<string, unknown>) => http<ObjectiveMilestone>(`${ENVIRONMENT_ENDPOINTS.objectives}/${objectiveId}/milestones`, { method: 'POST', body: JSON.stringify(input) }),
    updateMilestone: (id: string, input: Record<string, unknown>) => http<ObjectiveMilestone>(`${ENVIRONMENT_ENDPOINTS.objectivesMilestones}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteMilestone: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.objectivesMilestones}/${id}`, { method: 'DELETE' }),
  },
  // Environmental Reports
  reports: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalReport[]>(addParams(ENVIRONMENT_ENDPOINTS.reports, params)),
    get: (id: string) => http<EnvironmentalReport>(`${ENVIRONMENT_ENDPOINTS.reports}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalReport>(ENVIRONMENT_ENDPOINTS.reports, { method: 'POST', body: JSON.stringify(input) }),
    generate: (input: Record<string, unknown>) => http<EnvironmentalReport>(ENVIRONMENT_ENDPOINTS.reportsGenerate, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalReport>(`${ENVIRONMENT_ENDPOINTS.reports}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.reports}/${id}`, { method: 'DELETE' }),
  },
  // AI
  ai: {
    getInsights: () => http<EnvironmentalAiInsights>(ENVIRONMENT_ENDPOINTS.aiInsights),
    getExecutiveSummary: () => http<EnvironmentalExecutiveSummary>(ENVIRONMENT_ENDPOINTS.aiExecutiveSummary),
  },
};
