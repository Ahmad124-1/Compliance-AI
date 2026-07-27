import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { broadcastService } from '../modules/broadcast/index.js';

const broadcastCreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  broadcastType: z.string().optional(),
  priority: z.string().optional(),
  scope: z.record(z.any()).optional(),
  channels: z.array(z.string()).optional(),
  locale: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  acknowledgementRequired: z.boolean().optional(),
  readTracking: z.boolean().optional(),
  expiryDate: z.string().optional(),
  pinned: z.boolean().optional(),
  scheduledAt: z.string().optional(),
});

const broadcastSendSchema = z.object({
  recipientIds: z.array(z.string().uuid()),
  channel: z.string().optional(),
});

export async function broadcastRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/broadcasts', { preHandler: requirePermission('broadcast:create'), schema: { body: broadcastCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof broadcastCreateSchema>;
    return broadcastService.create(auth.org, auth.sub, body);
  });

  app.get('/broadcasts', { preHandler: requirePermission('broadcast:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { broadcastType?: string; priority?: string; limit?: string; offset?: string };
    return broadcastService.list(auth.org, {
      broadcastType: q.broadcastType,
      priority: q.priority,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
  });

  app.get('/broadcasts/:id', { preHandler: requirePermission('broadcast:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return broadcastService.get(auth.org, id);
  });

  app.post('/broadcasts/:id/send', { preHandler: requirePermission('broadcast:send'), schema: { body: broadcastSendSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof broadcastSendSchema>;
    return broadcastService.send(auth.org, id, body.recipientIds, body.channel);
  });

  app.post('/broadcasts/:id/acknowledge', { preHandler: requirePermission('broadcast:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return broadcastService.acknowledge(auth.org, id, auth.sub);
  });

  app.post('/broadcasts/:id/read', { preHandler: requirePermission('broadcast:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return broadcastService.markRead(auth.org, id, auth.sub);
  });

  app.patch('/broadcasts/:id', { preHandler: requirePermission('broadcast:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { title?: string; body?: string; pinned?: boolean; expiryDate?: string };
    return broadcastService.update(auth.org, id, body);
  });

  app.delete('/broadcasts/:id', { preHandler: requirePermission('broadcast:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return broadcastService.delete(auth.org, id);
  });
}
