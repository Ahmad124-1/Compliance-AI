import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { messagingService } from '../modules/messaging/index.js';

const sendMessageSchema = z.object({
  recipientId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  channel: z.string().optional(),
  channels: z.array(z.string()).optional(),
  attachments: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function messagingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/messages', { preHandler: requirePermission('message:create'), schema: { body: sendMessageSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof sendMessageSchema>;
    return messagingService.send({ organizationId: auth.org, senderId: auth.sub, ...body });
  });

  app.get('/messages', { preHandler: requirePermission('message:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { conversationId?: string; limit?: string; offset?: string };
    return messagingService.getMessages(auth.org, auth.sub, {
      conversationId: q.conversationId,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
  });

  app.get('/messages/:id', { preHandler: requirePermission('message:read') }, async (req) => {
    const { id } = req.params as { id: string };
    const { messageRepo } = await import('../repositories/message.repo.js');
    const message = await messageRepo.findById(id);
    if (!message) throw new Error('Message not found');
    return message;
  });
}
