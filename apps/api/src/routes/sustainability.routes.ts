import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { sustainabilityProgramService } from '../services/sustainability-programs.service.js';
import { esgGoalService } from '../services/esg-goals.service.js';
import { kpiEngineService } from '../services/kpi-engine.service.js';
import { initiativeService, milestoneService } from '../services/initiatives.service.js';
import { sdgMapperService } from '../services/sdg-mapper.service.js';
import { sustainabilityEvidenceService } from '../services/sustainability-evidence.service.js';
import { sustainabilityWorkflowService } from '../services/sustainability-workflows.service.js';
import { sustainabilityReportService } from '../services/sustainability-reports.service.js';
import { sustainabilityAnalyticsService } from '../services/sustainability-analytics.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const programCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().default('general'),
  ownerId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedStandards: z.array(z.record(z.string(), z.unknown())).default([]),
  linkedSdgs: z.array(z.number().int().min(1).max(17)).default([]),
  linkedEsgPillars: z.array(z.enum(['environment', 'social', 'governance'])).default([]),
});

const programUpdateSchema = programCreateSchema.partial();

const goalCreateSchema = z.object({
  programId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  esgPillar: z.enum(['environment', 'social', 'governance']),
  baseline: z.number().nullable().optional(),
  targetValue: z.number(),
  unit: z.string().default('%'),
  currentValue: z.number().nullable().optional(),
  deadline: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedSdgs: z.array(z.number().int().min(1).max(17)).default([]),
});

const goalUpdateSchema = goalCreateSchema.partial();

const kpiCreateSchema = z.object({
  programId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  initiativeId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  kpiType: z.enum(['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  unit: z.string().default(''),
  targetValue: z.number().nullable().optional(),
  baselineValue: z.number().nullable().optional(),
  thresholdWarning: z.number().nullable().optional(),
  thresholdCritical: z.number().nullable().optional(),
  aggregation: z.enum(['latest', 'sum', 'avg', 'min', 'max', 'count']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  facilityId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

const kpiUpdateSchema = kpiCreateSchema.partial();

const measurementSchema = z.object({
  value: z.number(),
  recordedBy: z.string().uuid().nullable().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  facilityId: z.string().uuid().nullable().optional(),
});

const initiativeCreateSchema = z.object({
  programId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  team: z.string().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  expectedImpact: z.string().optional(),
  actualImpact: z.string().optional(),
  status: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedSdgs: z.array(z.number().int().min(1).max(17)).default([]),
});

const initiativeUpdateSchema = initiativeCreateSchema.partial();

const milestoneCreateSchema = z.object({
  initiativeId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

const milestoneUpdateSchema = milestoneCreateSchema.partial();

const evidenceCreateSchema = z.object({
  entityType: z.enum(['program', 'goal', 'kpi', 'initiative', 'milestone', 'report']),
  entityId: z.string().uuid(),
  documentId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  evidenceType: z.enum(['policy', 'invoice', 'utility_bill', 'audit_report', 'certificate', 'photo', 'training_record', 'contract', 'esg_evidence', 'other']),
  tags: z.array(z.string()).default([]),
  version: z.number().int().positive().optional(),
  expiryDate: z.string().nullable().optional(),
  uploadedBy: z.string().uuid().nullable().optional(),
  aiExtractedData: z.record(z.unknown()).optional(),
});

const _approvalTransitionStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'archived'] as const;
type ApprovalTransitionStatus = (typeof _approvalTransitionStatuses)[number];

const reportCreateSchema = z.object({
  programId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['progress', 'goal_status', 'sdg_contribution', 'kpi_performance', 'initiative_status', 'executive_summary']),
  format: z.enum(['pdf', 'xlsx', 'docx']).optional(),
  params: z.record(z.unknown()).optional(),
});

const reportUpdateSchema = reportCreateSchema.partial();

export async function sustainabilityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Programs ----
  app.get('/sustainability/programs', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return sustainabilityProgramService.list(auth.org, {
      search: q.search,
      category: q.category,
      status: q.status,
      departmentId: q.departmentId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sustainability/programs/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityProgramService.get(auth.org, id);
  });

  app.post('/sustainability/programs', { preHandler: requirePermission('sustainability:create'), schema: { body: programCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityProgramService.create(auth.org, req.body as z.infer<typeof programCreateSchema>);
  });

  app.patch('/sustainability/programs/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: programUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityProgramService.update(auth.org, id, req.body as Partial<z.infer<typeof programCreateSchema>>);
  });

  app.delete('/sustainability/programs/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityProgramService.delete(auth.org, id);
  });

  // ---- ESG Goals ----
  app.get('/sustainability/goals', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgGoalService.list(auth.org, {
      search: q.search,
      esgPillar: q.esgPillar,
      status: q.status,
      programId: q.programId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sustainability/goals/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgGoalService.get(auth.org, id);
  });

  app.post('/sustainability/goals', { preHandler: requirePermission('sustainability:create'), schema: { body: goalCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgGoalService.create(auth.org, req.body as z.infer<typeof goalCreateSchema>);
  });

  app.patch('/sustainability/goals/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: goalUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgGoalService.update(auth.org, id, req.body as Partial<z.infer<typeof goalCreateSchema>>);
  });

  app.delete('/sustainability/goals/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgGoalService.delete(auth.org, id);
  });

  // ---- KPIs ----
  app.get('/sustainability/kpis', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return kpiEngineService.list(auth.org, {
      search: q.search,
      kpiType: q.kpiType,
      frequency: q.frequency,
      programId: q.programId,
      goalId: q.goalId,
      initiativeId: q.initiativeId,
      departmentId: q.departmentId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sustainability/kpis/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return kpiEngineService.get(auth.org, id);
  });

  app.post('/sustainability/kpis', { preHandler: requirePermission('sustainability:create'), schema: { body: kpiCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return kpiEngineService.create(auth.org, req.body as z.infer<typeof kpiCreateSchema>);
  });

  app.post('/sustainability/kpis/:id/measurements', { preHandler: requirePermission('sustainability:create'), schema: { body: measurementSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return kpiEngineService.recordMeasurement(auth.org, id, req.body as z.infer<typeof measurementSchema>);
  });

  app.get('/sustainability/kpis/:id/measurements', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const q = req.query as Record<string, string | undefined>;
    return kpiEngineService.getMeasurements(auth.org, id, q.limit ? Number(q.limit) : undefined, q.offset ? Number(q.offset) : undefined);
  });

  app.get('/sustainability/kpis/:id/trend', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const q = req.query as Record<string, string | undefined>;
    return kpiEngineService.getTrend(auth.org, id, q.fromDate ?? '', q.toDate ?? '');
  });

  app.get('/sustainability/kpis/:id/aggregated', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const q = req.query as Record<string, string | undefined>;
    return kpiEngineService.getAggregated(auth.org, id, q.frequency ?? 'monthly', q.fromDate, q.toDate);
  });

  app.patch('/sustainability/kpis/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: kpiUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return kpiEngineService.update(auth.org, id, req.body as Partial<z.infer<typeof kpiCreateSchema>>);
  });

  app.delete('/sustainability/kpis/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return kpiEngineService.delete(auth.org, id);
  });

  // ---- Initiatives ----
  app.get('/sustainability/initiatives', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return initiativeService.list(auth.org, {
      search: q.search,
      programId: q.programId,
      status: q.status,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sustainability/initiatives/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return initiativeService.get(auth.org, id);
  });

  app.post('/sustainability/initiatives', { preHandler: requirePermission('sustainability:create'), schema: { body: initiativeCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return initiativeService.create(auth.org, req.body as z.infer<typeof initiativeCreateSchema>);
  });

  app.patch('/sustainability/initiatives/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: initiativeUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return initiativeService.update(auth.org, id, req.body as Partial<z.infer<typeof initiativeCreateSchema>>);
  });

  app.delete('/sustainability/initiatives/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return initiativeService.delete(auth.org, id);
  });

  // ---- Milestones ----
  app.post('/sustainability/milestones', { preHandler: requirePermission('sustainability:create'), schema: { body: milestoneCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return milestoneService.create(auth.org, req.body as z.infer<typeof milestoneCreateSchema>);
  });

  app.get('/sustainability/initiatives/:id/milestones', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return milestoneService.listByInitiative(auth.org, id);
  });

  app.patch('/sustainability/milestones/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: milestoneUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return milestoneService.update(auth.org, id, req.body as Partial<z.infer<typeof milestoneCreateSchema>>);
  });

  app.delete('/sustainability/milestones/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return milestoneService.delete(auth.org, id);
  });

  // ---- SDG Mapping ----
  app.get('/sustainability/sdgs', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    if (q.entityType && q.entityId) {
      return sdgMapperService.listByEntity(auth.org, q.entityType, q.entityId);
    }
    return sdgMapperService.listByOrganization(auth.org, {
      entityType: q.entityType,
      entityId: q.entityId,
      sdgId: q.sdgId ? Number(q.sdgId) : undefined,
    });
  });

  app.get('/sustainability/sdgs/constants', { preHandler: requirePermission('sustainability:read') }, async () => {
    return { sdgs: sdgMapperService.getSdgList() };
  });

  app.get('/sustainability/sdgs/contribution', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sdgMapperService.getContribution(auth.org);
  });

  app.post('/sustainability/sdgs', { preHandler: requirePermission('sustainability:create') }, async (req) => {
    const auth = getAuth(req);
    return sdgMapperService.create(auth.org, req.body as { sdgId: number; entityType: string; entityId: string; contributionPct?: number; description?: string });
  });

  app.delete('/sustainability/sdgs/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sdgMapperService.delete(auth.org, id);
  });

  // ---- Evidence ----
  app.get('/sustainability/evidence', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    if (q.entityType && q.entityId) {
      return sustainabilityEvidenceService.listByEntity(auth.org, q.entityType, q.entityId);
    }
    const result = await sustainabilityEvidenceService.listByOrganization(auth.org, {
      entityType: q.entityType,
      evidenceType: q.evidenceType,
      approvalStatus: q.approvalStatus,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
    return result;
  });

  app.get('/sustainability/evidence/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityEvidenceService.listByEntity(auth.org, (req.query as Record<string, string>).entityType ?? 'program', id);
  });

  app.post('/sustainability/evidence', { preHandler: requirePermission('sustainability:create'), schema: { body: evidenceCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityEvidenceService.create(auth.org, req.body as z.infer<typeof evidenceCreateSchema>);
  });

  app.patch('/sustainability/evidence/:id', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityEvidenceService.update(auth.org, id, req.body as Partial<z.infer<typeof evidenceCreateSchema>>);
  });

  app.delete('/sustainability/evidence/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityEvidenceService.delete(auth.org, id);
  });

  // ---- Approvals ----
  app.post('/sustainability/approvals', { preHandler: requirePermission('sustainability:create') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityWorkflowService.createApproval(auth.org, req.body as any);
  });

  app.get('/sustainability/approvals', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return sustainabilityWorkflowService.listByOrganization(auth.org, { status: q.status, entityType: q.entityType });
  });

  app.get('/sustainability/approvals/:entityType/:entityId', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    return sustainabilityWorkflowService.listByEntity(auth.org, entityType, entityId);
  });

  app.patch('/sustainability/approvals/:id', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityWorkflowService.transition(auth.org, id, (req.body as { status: ApprovalTransitionStatus }).status, (req.body as any).reviewerId, (req.body as any).comments);
  });

  app.delete('/sustainability/approvals/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityWorkflowService.delete(auth.org, id);
  });

  // ---- Reports ----
  app.get('/sustainability/reports', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return sustainabilityReportService.list(auth.org, {
      search: q.search,
      reportType: q.reportType,
      status: q.status,
      programId: q.programId,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sustainability/reports/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityReportService.get(auth.org, id);
  });

  app.post('/sustainability/reports', { preHandler: requirePermission('sustainability:create'), schema: { body: reportCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityReportService.create(auth.org, req.body as z.infer<typeof reportCreateSchema>);
  });

  app.patch('/sustainability/reports/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: reportUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityReportService.update(auth.org, id, req.body as Partial<z.infer<typeof reportCreateSchema>>);
  });

  app.delete('/sustainability/reports/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sustainabilityReportService.delete(auth.org, id);
  });

  // ---- Analytics ----
  app.get('/sustainability/analytics/dashboard', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getDashboard(auth.org);
  });

  app.get('/sustainability/analytics/progress/:programId', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { programId } = req.params as { programId: string };
    return sustainabilityAnalyticsService.getProgramProgress(auth.org, programId);
  });

  app.get('/sustainability/analytics/goal-completion', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getGoalCompletion(auth.org);
  });

  app.get('/sustainability/analytics/kpi-trends', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return sustainabilityAnalyticsService.getKpiTrends(auth.org, q.kpiId!, q.fromDate ?? '', q.toDate ?? '');
  });

  app.get('/sustainability/analytics/initiatives', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getInitiativePerformance(auth.org);
  });

  app.get('/sustainability/analytics/department-comparison', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getDepartmentComparison(auth.org);
  });

  app.get('/sustainability/analytics/esg-pillar-distribution', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getEsgPillarDistribution(auth.org);
  });

  app.get('/sustainability/analytics/sdg-contribution', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sustainabilityAnalyticsService.getSdgContribution(auth.org);
  });
}