import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { channelManagerService } from '../modules/channel-manager/index.js';

const channelPrioritySchema = z.object({
  channel: z.string().min(1),
  priority: z.number().int(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export async function channelManagerRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/channels', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { userId?: string };
    return channelManagerService.getConfig(auth.org, q.userId);
  });

  app.post('/channels/priority', { preHandler: requirePermission('organization:update'), schema: { body: channelPrioritySchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof channelPrioritySchema>;
    return channelManagerService.setChannelPriority(auth.org, auth.sub, body.channel, body.priority, body.enabled, body.config);
  });

  app.get('/channels/recommend', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { priority?: string; recipientId?: string; category?: string };
    return channelManagerService.selectOptimalChannel(auth.org, {
      priority: q.priority ?? 'normal',
      recipientId: q.recipientId,
      category: q.category,
    });
  });
}
