import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { environmentService } from '../services/environment.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const waterUsageCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  sourceType: z.enum(['ground_water','municipal','rainwater','recycled','surface_water','other']),
  consumptionDate: z.string().min(1),
  consumptionAmount: z.number(),
  unit: z.string().default('m3'),
  dischargeAmount: z.number().nullable().optional(),
  dischargeQuality: z.string().optional(),
  treatmentMethod: z.string().optional(),
  reuseAmount: z.number().default(0),
  leakDetected: z.boolean().default(false),
  leakDetails: z.string().optional(),
  waterIntensity: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

const waterUsageUpdateSchema = waterUsageCreateSchema.partial();

const wasteRecordCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  wasteType: z.enum(['general','hazardous','electronic','plastic','paper','organic','metal','chemical','medical','construction','other']),
  quantity: z.number(),
  unit: z.string().default('kg'),
  weight: z.number().optional(),
  disposalMethod: z.string().min(1),
  recyclerId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  manifestNumber: z.string().optional(),
  certificateUrl: z.string().url().optional(),
  hazardousDetails: z.string().optional(),
  wasteDate: z.string().min(1),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

const wasteRecordUpdateSchema = wasteRecordCreateSchema.partial();

const airEmissionCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  emissionSourceId: z.string().uuid().nullable().optional(),
  emissionType: z.enum(['stack','boiler','generator','dust','voc','nox','sox','pm25','pm10','co','co2','methane','other']),
  quantity: z.number(),
  unit: z.string().default('kg'),
  monitoringFrequency: z.enum(['continuous','daily','weekly','monthly','quarterly','yearly','other']).nullable().optional(),
  emissionLimit: z.number().optional(),
  concentration: z.number().optional(),
  emissionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  notes: z.string().optional(),
});

const airEmissionUpdateSchema = airEmissionCreateSchema.partial();

const chemicalCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  chemicalName: z.string().min(1),
  casNumber: z.string().optional(),
  formula: z.string().optional(),
  hazardClassification: z.enum(['flammable','toxic','corrosive','explosive','reactive','environmental','carcinogen','mutagen','oxidizer','irritant','other']),
  storageLocation: z.string().optional(),
  quantity: z.number(),
  unit: z.string().default('kg'),
  supplierId: z.string().uuid().nullable().optional(),
  expiryDate: z.string().optional(),
  msdsUrl: z.string().url().optional(),
  usageDescription: z.string().optional(),
  riskRating: z.enum(['low','medium','high','extreme']).nullable().optional(),
  emergencyProcedures: z.string().optional(),
  ppeRequirements: z.string().optional(),
  approvalStatus: z.enum(['pending','approved','rejected','expired']).default('pending'),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.string().optional(),
  notes: z.string().optional(),
});

const chemicalUpdateSchema = chemicalCreateSchema.partial();

const incidentCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  incidentType: z.enum(['chemical_spill','water_leak','oil_spill','air_pollution','illegal_disposal','hazardous_release','permit_violation','environmental_complaint','noise_pollution','soil_contamination','other']),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['low','medium','high','critical']).default('medium'),
  status: z.enum(['open','investigating','contained','resolved','closed','escalated']).default('open'),
  incidentDate: z.string().optional(),
  location: z.string().optional(),
  rootCause: z.string().optional(),
  capaId: z.string().uuid().nullable().optional(),
  investigationStatus: z.enum(['pending','in_progress','completed','not_required']).nullable().optional(),
  investigationNotes: z.string().optional(),
  evidenceUrls: z.array(z.string()).default([]),
  timeline: z.array(z.record(z.string(), z.unknown())).default([]),
  responsiblePersonId: z.string().uuid().nullable().optional(),
  resolvedBy: z.string().uuid().nullable().optional(),
  resolutionDate: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

const incidentUpdateSchema = incidentCreateSchema.partial();

const riskCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  aspect: z.string().min(1),
  impact: z.string().min(1),
  likelihood: z.enum(['rare','unlikely','possible','likely','almost_certain']),
  severity: z.enum(['negligible','minor','moderate','major','severe']),
  riskScore: z.number(),
  controls: z.string().optional(),
  mitigationMeasures: z.string().optional(),
  monitoringPlan: z.string().optional(),
  responsibleOwnerId: z.string().uuid().nullable().optional(),
  reviewSchedule: z.enum(['monthly','quarterly','bi_annual','annual','as_needed']).nullable().optional(),
  lastReviewDate: z.string().optional(),
  nextReviewDate: z.string().optional(),
  status: z.enum(['active','mitigated','closed','accepted']).default('active'),
  notes: z.string().optional(),
});

const riskUpdateSchema = riskCreateSchema.partial();

const permitCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  permitType: z.enum(['water','air','waste','chemical','environmental_approval','discharge','emission','storage','transport','other']),
  permitNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  issueDate: z.string().min(1),
  expiryDate: z.string().min(1),
  renewalDate: z.string().optional(),
  status: z.enum(['active','expired','pending','revoked','suspended','renewed']).default('active'),
  conditions: z.string().optional(),
  supportingDocuments: z.array(z.string()).default([]),
  approvalHistory: z.array(z.record(z.string(), z.unknown())).default([]),
  responsiblePersonId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

const permitUpdateSchema = permitCreateSchema.partial();

const resourceUsageCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  resourceType: z.enum(['electricity','gas','fuel','steam','compressed_air','water','other']),
  consumptionAmount: z.number(),
  unit: z.string().min(1),
  cost: z.number().optional(),
  consumptionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  efficiencyRating: z.number().optional(),
  intensityMetric: z.number().optional(),
  notes: z.string().optional(),
});

const resourceUsageUpdateSchema = resourceUsageCreateSchema.partial();

const projectCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  projectName: z.string().min(1),
  description: z.string().optional(),
  projectType: z.enum(['protected_area','tree_plantation','green_area','wildlife','habitat_protection','restoration','environmental_initiative','other']),
  status: z.enum(['planning','approved','in_progress','completed','cancelled','on_hold']).default('planning'),
  budget: z.number().optional(),
  actualCost: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  location: z.string().optional(),
  areaCovered: z.number().optional(),
  treesPlanted: z.number().int().optional(),
  evidenceUrls: z.array(z.string()).default([]),
  progressNotes: z.string().optional(),
});

const projectUpdateSchema = projectCreateSchema.partial();

export async function environmentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Dashboard ----
  app.get('/environment/dashboard', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentService.getDashboard(auth.org);
  });

  // ---- Water Usage ----
  app.get('/environment/water', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listWaterUsage(auth.org, { facilityId: q.facilityId, siteId: q.siteId, sourceType: q.sourceType, startDate: q.startDate, endDate: q.endDate });
  });

  app.get('/environment/water/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getWaterUsage(auth.org, id);
  });

  app.post('/environment/water', { preHandler: requirePermission('environment:create'), schema: { body: waterUsageCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createWaterUsage(auth.org, req.body as z.infer<typeof waterUsageCreateSchema>, auth.sub);
  });

  app.patch('/environment/water/:id', { preHandler: requirePermission('environment:update'), schema: { body: waterUsageUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateWaterUsage(auth.org, id, req.body as Partial<z.infer<typeof waterUsageCreateSchema>>, auth.sub);
  });

  app.delete('/environment/water/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteWaterUsage(auth.org, id, auth.sub);
  });

  // ---- Waste Records ----
  app.get('/environment/waste', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listWasteRecords(auth.org, { facilityId: q.facilityId, siteId: q.siteId, wasteType: q.wasteType, startDate: q.startDate, endDate: q.endDate });
  });

  app.get('/environment/waste/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getWasteRecord(auth.org, id);
  });

  app.post('/environment/waste', { preHandler: requirePermission('environment:create'), schema: { body: wasteRecordCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createWasteRecord(auth.org, req.body as z.infer<typeof wasteRecordCreateSchema>, auth.sub);
  });

  app.patch('/environment/waste/:id', { preHandler: requirePermission('environment:update'), schema: { body: wasteRecordUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateWasteRecord(auth.org, id, req.body as Partial<z.infer<typeof wasteRecordCreateSchema>>, auth.sub);
  });

  app.delete('/environment/waste/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteWasteRecord(auth.org, id, auth.sub);
  });

  // ---- Air Emissions ----
  app.get('/environment/air', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listAirEmissions(auth.org, { facilityId: q.facilityId, emissionSourceId: q.emissionSourceId, emissionType: q.emissionType, reportingPeriod: q.reportingPeriod, startDate: q.startDate, endDate: q.endDate });
  });

  app.get('/environment/air/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getAirEmission(auth.org, id);
  });

  app.post('/environment/air', { preHandler: requirePermission('environment:create'), schema: { body: airEmissionCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createAirEmission(auth.org, req.body as z.infer<typeof airEmissionCreateSchema>, auth.sub);
  });

  app.patch('/environment/air/:id', { preHandler: requirePermission('environment:update'), schema: { body: airEmissionUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateAirEmission(auth.org, id, req.body as Partial<z.infer<typeof airEmissionCreateSchema>>, auth.sub);
  });

  app.delete('/environment/air/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteAirEmission(auth.org, id, auth.sub);
  });

  // ---- Chemicals ----
  app.get('/environment/chemicals', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listChemicals(auth.org, { facilityId: q.facilityId, siteId: q.siteId, hazardClassification: q.hazardClassification, approvalStatus: q.approvalStatus, riskRating: q.riskRating });
  });

  app.get('/environment/chemicals/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getChemical(auth.org, id);
  });

  app.post('/environment/chemicals', { preHandler: requirePermission('environment:create'), schema: { body: chemicalCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createChemical(auth.org, req.body as z.infer<typeof chemicalCreateSchema>, auth.sub);
  });

  app.patch('/environment/chemicals/:id', { preHandler: requirePermission('environment:update'), schema: { body: chemicalUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateChemical(auth.org, id, req.body as Partial<z.infer<typeof chemicalCreateSchema>>, auth.sub);
  });

  app.delete('/environment/chemicals/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteChemical(auth.org, id, auth.sub);
  });

  // ---- Environmental Incidents ----
  app.get('/environment/incidents', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listIncidents(auth.org, { facilityId: q.facilityId, siteId: q.siteId, incidentType: q.incidentType, severity: q.severity, status: q.status, startDate: q.startDate, endDate: q.endDate });
  });

  app.get('/environment/incidents/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getIncident(auth.org, id);
  });

  app.post('/environment/incidents', { preHandler: requirePermission('environment:create'), schema: { body: incidentCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createIncident(auth.org, req.body as z.infer<typeof incidentCreateSchema>, auth.sub);
  });

  app.patch('/environment/incidents/:id', { preHandler: requirePermission('environment:update'), schema: { body: incidentUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateIncident(auth.org, id, req.body as Partial<z.infer<typeof incidentCreateSchema>>, auth.sub);
  });

  app.delete('/environment/incidents/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteIncident(auth.org, id, auth.sub);
  });

  // ---- Environmental Risks ----
  app.get('/environment/risks', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listRisks(auth.org, { facilityId: q.facilityId, siteId: q.siteId, status: q.status, minScore: q.minScore ? Number(q.minScore) : undefined, maxScore: q.maxScore ? Number(q.maxScore) : undefined });
  });

  app.get('/environment/risks/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getRisk(auth.org, id);
  });

  app.post('/environment/risks', { preHandler: requirePermission('environment:create'), schema: { body: riskCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createRisk(auth.org, req.body as z.infer<typeof riskCreateSchema>, auth.sub);
  });

  app.patch('/environment/risks/:id', { preHandler: requirePermission('environment:update'), schema: { body: riskUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateRisk(auth.org, id, req.body as Partial<z.infer<typeof riskCreateSchema>>, auth.sub);
  });

  app.delete('/environment/risks/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteRisk(auth.org, id, auth.sub);
  });

  // ---- Permits ----
  app.get('/environment/permits', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listPermits(auth.org, { facilityId: q.facilityId, siteId: q.siteId, permitType: q.permitType, status: q.status, expiringSoon: q.expiringSoon === 'true' || q.expiringSoon === '1' });
  });

  app.get('/environment/permits/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getPermit(auth.org, id);
  });

  app.post('/environment/permits', { preHandler: requirePermission('environment:create'), schema: { body: permitCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createPermit(auth.org, req.body as z.infer<typeof permitCreateSchema>, auth.sub);
  });

  app.patch('/environment/permits/:id', { preHandler: requirePermission('environment:update'), schema: { body: permitUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updatePermit(auth.org, id, req.body as Partial<z.infer<typeof permitCreateSchema>>, auth.sub);
  });

  app.delete('/environment/permits/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deletePermit(auth.org, id, auth.sub);
  });

  // ---- Resource Usage ----
  app.get('/environment/resources', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listResourceUsage(auth.org, { facilityId: q.facilityId, siteId: q.siteId, departmentId: q.departmentId, resourceType: q.resourceType, reportingPeriod: q.reportingPeriod, startDate: q.startDate, endDate: q.endDate });
  });

  app.get('/environment/resources/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getResourceUsage(auth.org, id);
  });

  app.post('/environment/resources', { preHandler: requirePermission('environment:create'), schema: { body: resourceUsageCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createResourceUsage(auth.org, req.body as z.infer<typeof resourceUsageCreateSchema>, auth.sub);
  });

  app.patch('/environment/resources/:id', { preHandler: requirePermission('environment:update'), schema: { body: resourceUsageUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateResourceUsage(auth.org, id, req.body as Partial<z.infer<typeof resourceUsageCreateSchema>>, auth.sub);
  });

  app.delete('/environment/resources/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteResourceUsage(auth.org, id, auth.sub);
  });

  // ---- Environmental Projects ----
  app.get('/environment/projects', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentService.listProjects(auth.org, { facilityId: q.facilityId, projectType: q.projectType, status: q.status });
  });

  app.get('/environment/projects/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.getProject(auth.org, id);
  });

  app.post('/environment/projects', { preHandler: requirePermission('environment:create'), schema: { body: projectCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentService.createProject(auth.org, req.body as z.infer<typeof projectCreateSchema>, auth.sub);
  });

  app.patch('/environment/projects/:id', { preHandler: requirePermission('environment:update'), schema: { body: projectUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.updateProject(auth.org, id, req.body as Partial<z.infer<typeof projectCreateSchema>>, auth.sub);
  });

  app.delete('/environment/projects/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentService.deleteProject(auth.org, id, auth.sub);
  });
}
