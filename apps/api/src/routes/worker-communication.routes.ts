import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { workerCommunicationService } from '../services/worker-communication.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const statusUpdateSchema = z.object({
  caseId: z.string().uuid(),
  updateType: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  isPublic: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  recipientType: z.string().min(1),
  recipientIds: z.array(z.string().uuid()).optional(),
  channel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function workerCommunicationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/worker-communication/status-updates', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { caseId?: string };
    return workerCommunicationService.listStatusUpdates(auth.org, q.caseId);
  });

  app.post('/worker-communication/status-updates', { preHandler: requirePermission('case:update'), schema: { body: statusUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof statusUpdateSchema>;
    return workerCommunicationService.sendStatusUpdate(
      {
        organizationId: auth.org,
        caseId: body.caseId,
        updateType: body.updateType,
        title: body.title,
        message: body.message,
        isPublic: body.isPublic,
        isAnonymous: body.isAnonymous,
        recipientType: body.recipientType,
        recipientIds: body.recipientIds,
        channel: body.channel,
        metadata: body.metadata,
      },
      auth.sub,
    );
  });

  app.get('/worker-communication/status-updates/:id', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return workerCommunicationService.getStatusUpdate(auth.org, id);
  });

  app.get('/worker-communication/timeline/:caseId', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    return workerCommunicationService.getTimeline(auth.org, caseId);
  });

  app.post('/worker-communication/:caseId/public-message', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    const { message } = req.body as { message: string };
    return workerCommunicationService.sendPublicMessage(auth.org, caseId, message, auth.sub);
  });

  app.post('/worker-communication/:caseId/request-info', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    const { message } = req.body as { message: string };
    return workerCommunicationService.requestAdditionalInfo(auth.org, caseId, message, auth.sub);
  });

  app.post('/worker-communication/:caseId/acknowledge', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    return workerCommunicationService.sendAcknowledgement(auth.org, caseId, auth.sub);
  });

  app.post('/worker-communication/:caseId/resolution-notice', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    const { message } = req.body as { message: string };
    return workerCommunicationService.sendResolutionNotice(auth.org, caseId, message, auth.sub);
  });

  app.post('/worker-communication/:caseId/close', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    return workerCommunicationService.sendCaseClosed(auth.org, caseId, auth.sub);
  });

  app.post('/worker-communication/:caseId/request-feedback', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    return workerCommunicationService.requestFeedback(auth.org, caseId, auth.sub);
  });
}
