import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { workerVoiceService } from '../services/worker-voice.service.js';
import { hotlineService } from '../services/hotline.service.js';
import { evidenceService } from '../services/evidence.service.js';
import { caseTrackingService } from '../services/case-tracking.service.js';
import { qrService } from '../services/qr.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  source: z.string().optional(),
  anonymous: z.boolean().optional(),
  language: z.string().min(2).max(5).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
});

const qrGenerateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  qrType: z.enum(['factory', 'department', 'dormitory', 'canteen', 'production_line', 'notice_board']),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  portalUrl: z.string().url('Enter a valid URL'),
});

const emergencyReportSchema = z.object({
  caseId: z.string().uuid().nullable().optional(),
  reporterName: z.string().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  emergencyType: z.string().min(1),
  description: z.string().min(1),
  location: z.string().nullable().optional(),
});

export async function workerVoiceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/worker-voice/dashboard', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    return workerVoiceService.getDashboard(auth.org);
  });

  app.post('/worker-voice/report', { preHandler: requirePermission('grievance:create'), schema: { body: reportSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof reportSchema>;
    return workerVoiceService.reportConcern({
      organizationId: auth.org,
      ...body,
    }, auth.sub);
  });

  app.get('/worker-voice/my-cases', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    return workerVoiceService.getMyCases(auth.org, auth.sub);
  });

  app.get('/worker-voice/cases/:id/track', { preHandler: requirePermission('case:read') }, async (req) => {
    const _auth = getAuth(req);
    const { id } = req.params as { id: string };
    const tracked = await caseTrackingService.trackCase(id);
    return tracked;
  });

  app.get('/worker-voice/hotline', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    return hotlineService.getContacts(auth.org);
  });

  app.post('/worker-voice/hotline/emergency', { preHandler: requirePermission('grievance:create'), schema: { body: emergencyReportSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof emergencyReportSchema>;
    return hotlineService.submitEmergencyReport({
      organizationId: auth.org,
      emergencyType: body.emergencyType,
      description: body.description,
      location: body.location ?? null,
      caseId: body.caseId ?? null,
      reporterName: body.reporterName ?? null,
      reporterPhone: body.reporterPhone ?? null,
    }, auth.sub);
  });

  app.post('/worker-voice/evidence/:caseId', { preHandler: requirePermission('case:update'), schema: { body: z.object({
    filename: z.string().min(1),
    originalFilename: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    storagePath: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })}}, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    const body = req.body as any;
    return evidenceService.addEvidenceToCase(auth.org, caseId, body, auth.sub);
  });

  app.get('/worker-voice/evidence/:caseId', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    return evidenceService.getCaseEvidence(auth.org, caseId);
  });

  app.post('/worker-voice/qr/generate', { preHandler: requirePermission('qr:create'), schema: { body: qrGenerateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof qrGenerateSchema>;
    return workerVoiceService.generateQRPortal({
      organizationId: auth.org,
      name: body.name,
      qrType: body.qrType,
      siteId: body.siteId ?? null,
      departmentId: body.departmentId ?? null,
      portalUrl: body.portalUrl,
    }, auth.sub);
  });

  app.get('/worker-voice/qr', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    return qrService.listQrCodes(auth.org, {});
  });
}
