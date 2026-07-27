import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { esgFrameworkService } from '../services/esg-frameworks.service.js';
import { esgMetricService } from '../services/esg-metrics.service.js';
import { esgPeriodService } from '../services/esg-periods.service.js';
import { esgDataService } from '../services/esg-data.service.js';
import { esgDisclosureService } from '../services/esg-disclosures.service.js';
import { esgReportService } from '../services/esg-reports.service.js';
import { esgAssuranceService } from '../services/esg-assurance.service.js';
import { esgMaterialityService } from '../services/esg-materiality.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const frameworkCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frameworkCode: z.enum(['gri', 'sasb', 'tcfd', 'csrd', 'cdp', 'djsi', 'mSCI', 'custom']),
  version: z.string().optional(),
  issuingBody: z.string().optional(),
  effectiveDate: z.string().optional(),
  categories: z.array(z.record(z.string(), z.unknown())).default([]),
});

const frameworkUpdateSchema = frameworkCreateSchema.partial();

const metricCreateSchema = z.object({
  frameworkId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  metricCode: z.string().min(1),
  category: z.string().min(1),
  pillar: z.enum(['environmental', 'social', 'governance']),
  unit: z.string().optional(),
  dataType: z.enum(['numeric', 'percentage', 'currency', 'boolean', 'text', 'date', 'json']),
  reportingFrequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'event_based', 'continuous']),
  applicableFacilities: z.array(z.string().uuid()).default([]),
  applicableDepartments: z.array(z.string().uuid()).default([]),
  calculationMethod: z.string().optional(),
  thresholdWarning: z.number().nullable().optional(),
  thresholdCritical: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  baselineValue: z.number().nullable().optional(),
  evidenceRequired: z.boolean().default(false),
  verificationRequired: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
});

const metricUpdateSchema = metricCreateSchema.partial();

const periodCreateSchema = z.object({
  name: z.string().min(1),
  periodType: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'custom']),
  startDate: z.string(),
  endDate: z.string(),
  dueDate: z.string(),
  frameworks: z.array(z.string().uuid()).default([]),
});

const periodUpdateSchema = periodCreateSchema.partial();

const dataPointCreateSchema = z.object({
  metricId: z.string().uuid(),
  periodId: z.string().uuid(),
  facilityId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  value: z.number(),
  valueText: z.string().optional(),
  valueJson: z.record(z.unknown()).optional(),
  unit: z.string().optional(),
  confidenceScore: z.number().nullable().optional(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().uuid().nullable().optional(),
});

const dataPointUpdateSchema = z.object({
  value: z.number().optional(),
  valueText: z.string().optional(),
  valueJson: z.record(z.unknown()).optional(),
  confidenceScore: z.number().nullable().optional(),
  notes: z.string().optional(),
});

const disclosureCreateSchema = z.object({
  frameworkId: z.string().uuid().nullable().optional(),
  metricId: z.string().uuid().nullable().optional(),
  periodId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  pillar: z.enum(['environmental', 'social', 'governance']),
  content: z.record(z.unknown()).default({}),
  summary: z.string().optional(),
  pageReference: z.string().optional(),
  linkedDocuments: z.array(z.string().uuid()).default([]),
  dataPoints: z.array(z.string().uuid()).default([]),
});

const disclosureUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected', 'published', 'archived']).optional(),
  content: z.record(z.unknown()).optional(),
  summary: z.string().optional(),
  pageReference: z.string().optional(),
  linkedDocuments: z.array(z.string().uuid()).optional(),
  dataPoints: z.array(z.string().uuid()).optional(),
  assuranceStatus: z.enum(['not_started', 'in_progress', 'completed', 'failed']).optional(),
});

const reportCreateSchema = z.object({
  periodId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['comprehensive', 'sustainability', 'climate', 'social', 'governance', 'regulatory_filing', 'executive_summary', 'stakeholder', 'custom']),
  format: z.enum(['pdf', 'xlsx', 'docx', 'json', 'html']),
  params: z.record(z.unknown()).optional(),
});

const reportUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'generating', 'completed', 'approved', 'published', 'archived', 'failed']).optional(),
  fileUrl: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  pagesCount: z.number().int().positive().optional(),
  summary: z.string().optional(),
});

const assuranceCreateSchema = z.object({
  reportId: z.string().uuid().nullable().optional(),
  disclosureId: z.string().uuid().nullable().optional(),
  assuranceType: z.enum(['internal', 'external', 'limited', 'reasonable', 'peer_review', 'third_party']),
  scopeDescription: z.string().min(1),
  providerName: z.string().optional(),
  providerEmail: z.string().email().optional(),
  assuranceDate: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

const assuranceUpdateSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  findings: z.array(z.record(z.unknown())).default([]),
  conclusion: z.string().optional(),
  opinionType: z.enum(['clean', 'qualified', 'adverse', 'disclaimer', 'not_applicable']).optional(),
  evidenceReferences: z.array(z.string().uuid()).default([]),
});

const materialityTopicCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  pillar: z.enum(['environmental', 'social', 'governance']),
  externalDrivers: z.array(z.string()).default([]),
  internalDrivers: z.array(z.string()).default([]),
  stakeholderGroups: z.array(z.string()).default([]),
  impactScore: z.number().min(0).max(5).optional(),
  likelihoodScore: z.number().min(0).max(5).optional(),
  financialImpact: z.enum(['high', 'medium', 'low', 'negligible']).optional(),
});

const materialityTopicUpdateSchema = materialityTopicCreateSchema.partial();

const materialityAssessmentCreateSchema = z.object({
  topicId: z.string().uuid(),
  periodId: z.string().uuid(),
  impactScore: z.number().min(0).max(5),
  likelihoodScore: z.number().min(0).max(5),
  stakeholderPriority: z.number().min(0).max(5).optional(),
  financialMateriality: z.boolean().default(false),
  impactMateriality: z.boolean().default(false),
  overallPriorityScore: z.number().min(0).max(10).optional(),
  justification: z.string().optional(),
  assessedBy: z.string().uuid().nullable().optional(),
});

const materialityAssessmentUpdateSchema = z.object({
  impactScore: z.number().min(0).max(5).optional(),
  likelihoodScore: z.number().min(0).max(5).optional(),
  stakeholderPriority: z.number().min(0).max(5).optional(),
  financialMateriality: z.boolean().optional(),
  impactMateriality: z.boolean().optional(),
  overallPriorityScore: z.number().min(0).max(10).optional(),
  justification: z.string().optional(),
  approved: z.boolean().optional(),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.string().optional(),
});

export async function esgRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Frameworks ----
  app.get('/esg/frameworks', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgFrameworkService.list(auth.org, {
      search: q.search,
      frameworkCode: q.frameworkCode,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    });
  });

  app.get('/esg/frameworks/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgFrameworkService.get(auth.org, id);
  });

  app.post('/esg/frameworks', { preHandler: requirePermission('esg:create'), schema: { body: frameworkCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgFrameworkService.create(auth.org, req.body as z.infer<typeof frameworkCreateSchema>);
  });

  app.patch('/esg/frameworks/:id', { preHandler: requirePermission('esg:update'), schema: { body: frameworkUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgFrameworkService.update(auth.org, id, req.body as Partial<z.infer<typeof frameworkCreateSchema>>);
  });

  app.delete('/esg/frameworks/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgFrameworkService.delete(auth.org, id);
  });

  // ---- Metrics ----
  app.get('/esg/metrics', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgMetricService.list(auth.org, {
      search: q.search,
      frameworkId: q.frameworkId,
      pillar: q.pillar,
      category: q.category,
      reportingFrequency: q.reportingFrequency,
      isMandatory: q.isMandatory !== undefined ? q.isMandatory === 'true' : undefined,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/esg/metrics/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMetricService.get(auth.org, id);
  });

  app.post('/esg/metrics', { preHandler: requirePermission('esg:create'), schema: { body: metricCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgMetricService.create(auth.org, req.body as z.infer<typeof metricCreateSchema>);
  });

  app.patch('/esg/metrics/:id', { preHandler: requirePermission('esg:update'), schema: { body: metricUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMetricService.update(auth.org, id, req.body as Partial<z.infer<typeof metricCreateSchema>>);
  });

  app.delete('/esg/metrics/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMetricService.delete(auth.org, id);
  });

  app.get('/esg/frameworks/:frameworkId/metrics', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { frameworkId } = req.params as { frameworkId: string };
    return esgMetricService.listByFramework(frameworkId, auth.org);
  });

  // ---- Reporting Periods ----
  app.get('/esg/periods', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgPeriodService.list(auth.org, {
      status: q.status,
      periodType: q.periodType,
    });
  });

  app.get('/esg/periods/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgPeriodService.get(auth.org, id);
  });

  app.post('/esg/periods', { preHandler: requirePermission('esg:create'), schema: { body: periodCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgPeriodService.create(auth.org, req.body as z.infer<typeof periodCreateSchema>);
  });

  app.patch('/esg/periods/:id', { preHandler: requirePermission('esg:update'), schema: { body: periodUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgPeriodService.update(auth.org, id, req.body as Partial<z.infer<typeof periodCreateSchema>>);
  });

  app.delete('/esg/periods/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgPeriodService.delete(auth.org, id);
  });

  // ---- Data Points ----
  app.get('/esg/data-points', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgDataService.list(auth.org, {
      metricId: q.metricId,
      periodId: q.periodId,
      facilityId: q.facilityId,
      departmentId: q.departmentId,
      isVerified: q.isVerified !== undefined ? q.isVerified === 'true' : undefined,
    });
  });

  app.get('/esg/data-points/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDataService.get(auth.org, id);
  });

  app.post('/esg/data-points', { preHandler: requirePermission('esg:create'), schema: { body: dataPointCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgDataService.create(auth.org, req.body as z.infer<typeof dataPointCreateSchema>);
  });

  app.patch('/esg/data-points/:id', { preHandler: requirePermission('esg:update'), schema: { body: dataPointUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDataService.update(auth.org, id, req.body as Partial<z.infer<typeof dataPointUpdateSchema>>);
  });

  app.post('/esg/data-points/:id/verify', { preHandler: requirePermission('esg:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDataService.verify(auth.org, id, auth.sub);
  });

  app.delete('/esg/data-points/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDataService.delete(auth.org, id);
  });

  // ---- Materiality Topics ----
  app.get('/esg/materiality/topics', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgMaterialityService.listTopics(auth.org, {
      pillar: q.pillar,
      category: q.category,
      financialImpact: q.financialImpact,
    });
  });

  app.get('/esg/materiality/topics/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMaterialityService.getTopic(auth.org, id);
  });

  app.post('/esg/materiality/topics', { preHandler: requirePermission('esg:create'), schema: { body: materialityTopicCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgMaterialityService.createTopic(auth.org, req.body as z.infer<typeof materialityTopicCreateSchema>);
  });

  app.patch('/esg/materiality/topics/:id', { preHandler: requirePermission('esg:update'), schema: { body: materialityTopicUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMaterialityService.updateTopic(auth.org, id, req.body as Partial<z.infer<typeof materialityTopicUpdateSchema>>);
  });

  app.delete('/esg/materiality/topics/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMaterialityService.deleteTopic(auth.org, id);
  });

  // ---- Materiality Assessments ----
  app.get('/esg/materiality/assessments', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgMaterialityService.listAssessments(auth.org, {
      periodId: q.periodId,
      topicId: q.topicId,
      approved: q.approved !== undefined ? q.approved === 'true' : undefined,
    });
  });

  app.get('/esg/materiality/assessments/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMaterialityService.getAssessment(auth.org, id);
  });

  app.post('/esg/materiality/assessments', { preHandler: requirePermission('esg:create'), schema: { body: materialityAssessmentCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgMaterialityService.createAssessment(auth.org, req.body as z.infer<typeof materialityAssessmentCreateSchema>);
  });

  app.patch('/esg/materiality/assessments/:id', { preHandler: requirePermission('esg:update'), schema: { body: materialityAssessmentUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgMaterialityService.updateAssessment(auth.org, id, req.body as Partial<z.infer<typeof materialityAssessmentUpdateSchema>>);
  });

  app.get('/esg/periods/:periodId/assessments', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { periodId } = req.params as { periodId: string };
    return esgMaterialityService.listAssessmentsByPeriod(periodId, auth.org);
  });

  // ---- Disclosures ----
  app.get('/esg/disclosures', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgDisclosureService.list(auth.org, {
      periodId: q.periodId,
      frameworkId: q.frameworkId,
      pillar: q.pillar,
      status: q.status,
      assuranceStatus: q.assuranceStatus,
    });
  });

  app.get('/esg/disclosures/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDisclosureService.get(auth.org, id);
  });

  app.post('/esg/disclosures', { preHandler: requirePermission('esg:create'), schema: { body: disclosureCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgDisclosureService.create(auth.org, req.body as z.infer<typeof disclosureCreateSchema>);
  });

  app.patch('/esg/disclosures/:id', { preHandler: requirePermission('esg:update'), schema: { body: disclosureUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDisclosureService.update(auth.org, id, req.body as z.infer<typeof disclosureUpdateSchema>);
  });

  app.delete('/esg/disclosures/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgDisclosureService.delete(auth.org, id);
  });

  // ---- Reports ----
  app.get('/esg/reports', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgReportService.list(auth.org, {
      periodId: q.periodId,
      reportType: q.reportType,
      status: q.status,
      format: q.format,
    });
  });

  app.get('/esg/reports/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgReportService.get(auth.org, id);
  });

  app.post('/esg/reports', { preHandler: requirePermission('esg:create'), schema: { body: reportCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgReportService.create(auth.org, req.body as z.infer<typeof reportCreateSchema>);
  });

  app.patch('/esg/reports/:id', { preHandler: requirePermission('esg:update'), schema: { body: reportUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgReportService.update(auth.org, id, req.body as Partial<z.infer<typeof reportUpdateSchema>>);
  });

  app.delete('/esg/reports/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgReportService.delete(auth.org, id);
  });

  // ---- Assurance ----
  app.get('/esg/assurance', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return esgAssuranceService.list(auth.org, {
      reportId: q.reportId,
      disclosureId: q.disclosureId,
      assuranceType: q.assuranceType,
      status: q.status,
    });
  });

  app.get('/esg/assurance/:id', { preHandler: requirePermission('esg:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgAssuranceService.get(auth.org, id);
  });

  app.post('/esg/assurance', { preHandler: requirePermission('esg:create'), schema: { body: assuranceCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return esgAssuranceService.create(auth.org, req.body as z.infer<typeof assuranceCreateSchema>);
  });

  app.patch('/esg/assurance/:id', { preHandler: requirePermission('esg:update'), schema: { body: assuranceUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgAssuranceService.update(auth.org, id, req.body as Partial<z.infer<typeof assuranceUpdateSchema>>);
  });

  app.delete('/esg/assurance/:id', { preHandler: requirePermission('esg:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return esgAssuranceService.delete(auth.org, id);
  });
}
