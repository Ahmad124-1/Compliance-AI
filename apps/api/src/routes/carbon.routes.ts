import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { carbonService } from '../services/carbon.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const facilityCreateSchema = z.object({
  name: z.string().min(1),
  facilityType: z.enum([
    'factory',
    'plant',
    'warehouse',
    'head_office',
    'regional_office',
    'distribution_center',
  ]),
  address: z.record(z.string(), z.unknown()).default({}),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().optional(),
});

const facilityUpdateSchema = facilityCreateSchema.partial();

const emissionSourceCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  facilityId: z.string().uuid().nullable().optional(),
  sourceCategory: z.enum([
    'fuel_consumption',
    'electricity',
    'steam',
    'purchased_energy',
    'water',
    'waste',
    'business_travel',
    'flights',
    'hotels',
    'employee_commuting',
    'freight',
    'shipping',
    'raw_materials',
    'packaging',
    'suppliers',
    'purchased_goods',
    'refrigerants',
    'industrial_processes',
    'other',
  ]),
  sourceType: z.enum([
    'diesel',
    'petrol',
    'natural_gas',
    'coal',
    'generators',
    'company_vehicles',
    'electricity',
    'steam',
    'purchased_cooling',
    'water',
    'waste',
    'flights',
    'hotels',
    'commute',
    'freight',
    'shipping',
    'raw_materials',
    'packaging',
    'suppliers',
    'refrigerants',
    'industrial',
    'custom',
  ]),
  scopeId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

const emissionSourceUpdateSchema = emissionSourceCreateSchema.partial();

const scopeCreateSchema = z.object({
  name: z.string().min(1),
  scopeNumber: z.number().int().min(1).max(3),
  description: z.string().optional(),
});

const scopeUpdateSchema = scopeCreateSchema.partial();

const emissionRecordCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  emissionSourceId: z.string().uuid().nullable().optional(),
  scopeId: z.string().uuid().nullable().optional(),
  activityType: z.string().min(1),
  activityData: z.record(z.string(), z.unknown()).default({}),
  co2e: z.number(),
  co2: z.number().optional(),
  ch4: z.number().optional(),
  n2o: z.number().optional(),
  hfc: z.number().optional(),
  pfc: z.number().optional(),
  sf6: z.number().optional(),
  unit: z.string().min(1),
  emissionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  calculationMethod: z.enum(['standard', 'mass_balance', 'engineering_estimate', 'metered_data', 'manual']).default('standard'),
  emissionFactorId: z.string().uuid().nullable().optional(),
  manualOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
  notes: z.string().optional(),
  isVerified: z.boolean().default(false),
});

const emissionRecordUpdateSchema = emissionRecordCreateSchema.partial();

const emissionFactorCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  factorType: z.enum(['electricity', 'fuel', 'waste', 'travel', 'supplier', 'country', 'custom']),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  value: z.number(),
  unit: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  geography: z.string().optional(),
  effectiveDate: z.string().min(1),
  expiryDate: z.string().optional(),
  version: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

const emissionFactorUpdateSchema = emissionFactorCreateSchema.partial();

const carbonProjectCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  projectType: z.enum([
    'solar_installation',
    'led_replacement',
    'ev_fleet',
    'water_conservation',
    'waste_reduction',
    'recycling',
    'process_optimization',
    'energy_efficiency',
    'renewable_energy',
    'other',
  ]),
  status: z.enum(['planning', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold']).default('planning'),
  budget: z.number().positive().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expectedReductionTco2e: z.number().optional(),
  actualReductionTco2e: z.number().optional(),
  roi: z.number().optional(),
  evidence: z.string().optional(),
});

const carbonProjectUpdateSchema = carbonProjectCreateSchema.partial();

const carbonOffsetCreateSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  offsetType: z.enum(['carbon_credit', 'verified_carbon', 'gold_standard', 'other']),
  registry: z.string().optional(),
  registryId: z.string().optional(),
  creditsPurchased: z.number(),
  creditsRetired: z.number().default(0),
  purchaseDate: z.string().min(1),
  expiryDate: z.string().optional(),
  costPerTon: z.number().optional(),
  totalCost: z.number().optional(),
  certificateUrl: z.string().url().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
  verifiedBy: z.string().uuid().nullable().optional(),
});

const carbonOffsetUpdateSchema = carbonOffsetCreateSchema.partial();

const reductionTargetCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  scopeId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetType: z.enum(['net_zero', 'annual', 'department', 'facility', 'scope', 'reduction_plan']),
  baselineEmissionsTco2e: z.number(),
  targetEmissionsTco2e: z.number(),
  baselineYear: z.number().int(),
  targetYear: z.number().int(),
  currentEmissionsTco2e: z.number().optional(),
  milestones: z.array(z.record(z.string(), z.unknown())).default([]),
});

const reductionTargetUpdateSchema = reductionTargetCreateSchema.partial();

const carbonReportCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum([
    'carbon_inventory',
    'ghg_inventory',
    'emission_summary',
    'scope_report',
    'facility_report',
    'project_report',
    'reduction_report',
    'executive_report',
    'cdp_report',
    'sbti_report',
  ]),
  format: z.enum(['pdf', 'xlsx', 'csv']).default('pdf'),
  generatedBy: z.string().uuid().nullable().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});

const carbonReportUpdateSchema = carbonReportCreateSchema.partial();

const calculateEmissionSchema = z.object({
  category: z.string().min(1),
  factorType: z.string().min(1),
  geography: z.string().optional(),
  activityValue: z.number(),
  calculationType: z.string().default('standard'),
});

/** Helper to build a combined-carbon permission guard that accepts carbon:* OR sustainability:*. */
function carbonPermission(action: 'read' | 'create' | 'update' | 'delete'): ReturnType<typeof requirePermission> {
  return requirePermission(`carbon:${action}`, `sustainability:${action}`);
}

export async function carbonRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Facilities ----
  app.get('/carbon/facilities', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listFacilities(auth.org, {
      facilityType: q.facilityType,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/facilities/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getFacility(auth.org, id);
  });

  app.post('/carbon/facilities', { preHandler: carbonPermission('create'), schema: { body: facilityCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createFacility(auth.org, req.body as z.infer<typeof facilityCreateSchema>);
  });

  app.patch('/carbon/facilities/:id', { preHandler: carbonPermission('update'), schema: { body: facilityUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateFacility(auth.org, id, req.body as Partial<z.infer<typeof facilityCreateSchema>>);
  });

  app.delete('/carbon/facilities/:id', { preHandler: carbonPermission('delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteFacility(auth.org, id);
  });

  // ---- Emission Sources ----
  app.get('/carbon/emission-sources', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionSources(auth.org, {
      facilityId: q.facilityId,
      sourceCategory: q.sourceCategory,
      sourceType: q.sourceType,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/emission-sources/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionSource(auth.org, id);
  });

  app.post('/carbon/emission-sources', { preHandler: carbonPermission('create'), schema: { body: emissionSourceCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionSource(auth.org, req.body as z.infer<typeof emissionSourceCreateSchema>);
  });

  app.patch('/carbon/emission-sources/:id', { preHandler: carbonPermission('update'), schema: { body: emissionSourceUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionSource(auth.org, id, req.body as Partial<z.infer<typeof emissionSourceCreateSchema>>);
  });

  app.delete('/carbon/emission-sources/:id', { preHandler: carbonPermission('delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteEmissionSource(auth.org, id);
  });

  // ---- Scopes ----
  app.get('/carbon/scopes', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    return carbonService.listScopes(auth.org);
  });

  app.get('/carbon/scopes/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getScope(auth.org, id);
  });

  app.post('/carbon/scopes', { preHandler: carbonPermission('create'), schema: { body: scopeCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createScope(auth.org, req.body as z.infer<typeof scopeCreateSchema>);
  });

  app.patch('/carbon/scopes/:id', { preHandler: carbonPermission('update'), schema: { body: scopeUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateScope(auth.org, id, req.body as Partial<z.infer<typeof scopeCreateSchema>>);
  });

  // ---- Emission Records ----
  app.get('/carbon/emissions', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionRecords(auth.org, {
      facilityId: q.facilityId,
      emissionSourceId: q.emissionSourceId,
      scopeId: q.scopeId,
      reportingPeriod: q.reportingPeriod,
      emissionDate: q.emissionDate,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/emissions/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionRecord(auth.org, id);
  });

  app.post('/carbon/emissions', { preHandler: carbonPermission('create'), schema: { body: emissionRecordCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionRecord(auth.org, req.body as z.infer<typeof emissionRecordCreateSchema>, auth.sub);
  });

  app.patch('/carbon/emissions/:id', { preHandler: carbonPermission('update'), schema: { body: emissionRecordUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionRecord(auth.org, id, req.body as Partial<z.infer<typeof emissionRecordCreateSchema>>, auth.sub);
  });

  app.delete('/carbon/emissions/:id', { preHandler: carbonPermission('delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteEmissionRecord(auth.org, id, auth.sub);
  });

  // ---- Emission Factors ----
  app.get('/carbon/emission-factors', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionFactors(auth.org, {
      factorType: q.factorType,
      category: q.category,
      activeOnly: q.activeOnly === 'true' || q.activeOnly === '1',
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/emission-factors/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionFactor(auth.org, id);
  });

  app.post('/carbon/emission-factors', { preHandler: carbonPermission('create'), schema: { body: emissionFactorCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionFactor(auth.org, req.body as z.infer<typeof emissionFactorCreateSchema>);
  });

  app.patch('/carbon/emission-factors/:id', { preHandler: carbonPermission('update'), schema: { body: emissionFactorUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionFactor(auth.org, id, req.body as Partial<z.infer<typeof emissionFactorCreateSchema>>);
  });

  // ---- Carbon Projects ----
  app.get('/carbon/projects', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCarbonProjects(auth.org, {
      projectType: q.projectType,
      status: q.status,
      facilityId: q.facilityId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/projects/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getCarbonProject(auth.org, id);
  });

  app.post('/carbon/projects', { preHandler: carbonPermission('create'), schema: { body: carbonProjectCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createCarbonProject(auth.org, req.body as z.infer<typeof carbonProjectCreateSchema>);
  });

  app.patch('/carbon/projects/:id', { preHandler: carbonPermission('update'), schema: { body: carbonProjectUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateCarbonProject(auth.org, id, req.body as Partial<z.infer<typeof carbonProjectCreateSchema>>);
  });

  // ---- Carbon Offsets ----
  app.get('/carbon/offsets', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCarbonOffsets(auth.org, {
      projectId: q.projectId,
      offsetType: q.offsetType,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/offsets/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getCarbonOffset(auth.org, id);
  });

  app.post('/carbon/offsets', { preHandler: carbonPermission('create'), schema: { body: carbonOffsetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createCarbonOffset(auth.org, req.body as z.infer<typeof carbonOffsetCreateSchema>);
  });

  app.patch('/carbon/offsets/:id', { preHandler: carbonPermission('update'), schema: { body: carbonOffsetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateCarbonOffset(auth.org, id, req.body as Partial<z.infer<typeof carbonOffsetCreateSchema>>);
  });

  // ---- Reduction Targets ----
  app.get('/carbon/targets', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listReductionTargets(auth.org, {
      targetType: q.targetType,
      status: q.status,
      facilityId: q.facilityId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/targets/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getReductionTarget(auth.org, id);
  });

  app.post('/carbon/targets', { preHandler: carbonPermission('create'), schema: { body: reductionTargetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createReductionTarget(auth.org, req.body as z.infer<typeof reductionTargetCreateSchema>);
  });

  app.patch('/carbon/targets/:id', { preHandler: carbonPermission('update'), schema: { body: reductionTargetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateReductionTarget(auth.org, id, req.body as Partial<z.infer<typeof reductionTargetCreateSchema>>);
  });

  // ---- Carbon Reports ----
  app.get('/carbon/reports', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCarbonReports(auth.org, {
      reportType: q.reportType,
      status: q.status,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/carbon/reports/:id', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getCarbonReport(auth.org, id);
  });

  app.post('/carbon/reports', { preHandler: carbonPermission('create'), schema: { body: carbonReportCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createCarbonReport(auth.org, req.body as z.infer<typeof carbonReportCreateSchema>);
  });

  app.patch('/carbon/reports/:id', { preHandler: carbonPermission('update'), schema: { body: carbonReportUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateCarbonReport(auth.org, id, req.body as Partial<z.infer<typeof carbonReportCreateSchema>>);
  });

  // ---- Dashboard ----
  app.get('/carbon/dashboard', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    return carbonService.getDashboard(auth.org);
  });

  // ---- Calculator ----
  app.post('/carbon/calculate', { preHandler: carbonPermission('create'), schema: { body: calculateEmissionSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.calculateEmission(auth.org, req.body as z.infer<typeof calculateEmissionSchema>, auth.sub);
  });

  // ---- Calculation History ----
  app.get('/carbon/calculations', { preHandler: carbonPermission('read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCalculationHistory(auth.org, {
      emissionRecordId: q.emissionRecordId,
      calculationType: q.calculationType,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });
}
