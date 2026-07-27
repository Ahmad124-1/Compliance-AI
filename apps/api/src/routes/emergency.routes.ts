import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { emergencyService } from '../modules/emergency/index.js';

const createAlertSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  alertType: z.string().min(1),
  priority: z.string().optional(),
  severity: z.string().optional(),
  scope: z.record(z.any()).optional(),
  channels: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  requiresAcknowledgement: z.boolean().optional(),
  escalationEnabled: z.boolean().optional(),
  escalationAfterMinutes: z.number().optional(),
  totalRecipients: z.number().optional(),
  expiresAt: z.string().optional(),
});

const _acknowledgeSchema = z.object({
  status: z.string().optional(),
  note: z.string().optional(),
  location: z.record(z.any()).optional(),
});

export async function emergencyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/emergency', { preHandler: requirePermission('emergency:create'), schema: { body: createAlertSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof createAlertSchema>;
    return emergencyService.createAlert(auth.org, auth.sub, body);
  });

  app.get('/emergency', { preHandler: requirePermission('emergency:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { alertType?: string; isActive?: string; limit?: string; offset?: string };
    return emergencyService.listAlerts(auth.org, {
      alertType: q.alertType,
      isActive: q.isActive ? q.isActive === 'true' : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
  });

  app.get('/emergency/:id', { preHandler: requirePermission('emergency:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return emergencyService.getAlert(auth.org, id);
  });

  app.post('/emergency/:id/acknowledge', { preHandler: requirePermission('emergency:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof _acknowledgeSchema>;
    return emergencyService.acknowledge(auth.org, id, auth.sub, body);
  });

  app.post('/emergency/:id/deactivate', { preHandler: requirePermission('emergency:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return emergencyService.deactivate(auth.org, id);
  });

  app.delete('/emergency/:id', { preHandler: requirePermission('emergency:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return emergencyService.delete(auth.org, id);
  });
}
