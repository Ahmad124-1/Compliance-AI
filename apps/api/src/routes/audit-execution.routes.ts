import type { FastifyInstance } from 'fastify';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { auditExecutionService } from '../modules/audits/services/audit.service.js';

export async function auditExecutionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const read = requirePermission('audit:read');
  const create = requirePermission('audit:create');
  const update = requirePermission('audit:update');

  app.get('/audits', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return auditExecutionService.listAudits(auth.org);
  });

  app.post('/audits', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return auditExecutionService.createAudit(auth.org, body as any, auth.sub);
  });

  app.get('/audits/:id', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return auditExecutionService.getAudit(id);
  });

  app.post('/audits/:id/start', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.startAudit(id, auth.sub);
  });

  app.post('/audits/:id/pause', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.pauseAudit(id, auth.sub);
  });

  app.post('/audits/:id/resume', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.resumeAudit(id, auth.sub);
  });

  app.post('/audits/:id/save-draft', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.saveDraft(id, auth.sub);
  });

  app.post('/audits/:id/sections/:sectionId/complete', { preHandler: update }, async (req) => {
    const { id, sectionId } = req.params as { id: string; sectionId: string };
    const auth = getAuth(req);
    await auditExecutionService.completeSection(id, sectionId, auth.sub);
    return { success: true };
  });

  app.post('/audits/:id/complete', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.completeAudit(id, auth.sub);
  });

  app.post('/audits/:id/cancel', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.cancelAudit(id, auth.sub);
  });

  app.post('/audits/:id/reopen', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.reopenAudit(id, auth.sub);
  });

  app.post('/audits/:id/clone', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.cloneAudit(id, auth.sub);
  });

  app.post('/audits/:id/observations', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.createObservation(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/findings', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.createFinding(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/evidence', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.addEvidence(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/interviews', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.createInterview(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/signatures', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.addSignature(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/calendar', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.createCalendarEvent(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/reminders', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.addReminder(id, req.body as any, auth.sub);
  });

  app.post('/audits/:id/progress/refresh', { preHandler: update }, async (req) => {
    const { id } = req.params as { id: string };
    const auth = getAuth(req);
    return auditExecutionService.refreshProgress(id);
  });
}
