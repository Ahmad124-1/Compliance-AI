import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { chatModuleService } from '../modules/chat/index.js';
import { chatService } from '../modules/ai/chat.service.js';
import { communicationService } from '../modules/communication/index.js';

const createConversationSchema = z.object({
  title: z.string().min(1),
});

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/ai/chat/conversations', { preHandler: requirePermission('ai:read'), schema: { body: createConversationSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof createConversationSchema>;
    return chatModuleService.createConversation(auth.org, auth.sub, body.title);
  });

  app.get('/ai/chat/conversations', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return chatModuleService.listConversations(auth.org, auth.sub);
  });

  app.get('/ai/chat/conversations/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return chatModuleService.getConversation(id);
  });

  const updateConversationSchema = z.object({
    title: z.string().optional(),
    pinned: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  });

  app.patch('/ai/chat/conversations/:id', { preHandler: requirePermission('ai:update'), schema: { body: updateConversationSchema } }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof updateConversationSchema>;
    return chatModuleService.updateConversation(id, body);
  });

  app.delete('/ai/chat/conversations/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return chatModuleService.deleteConversation(id);
  });

  app.get('/ai/chat/conversations/search', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { query: string };
    return chatModuleService.searchConversations(auth.org, q.query);
  });

  const sendMessageSchema = z.object({
    message: z.string().min(1),
    supplierId: z.string().uuid().optional(),
    auditId: z.string().uuid().optional(),
    useRag: z.boolean().optional(),
    systemPrompt: z.string().optional(),
  });

  app.post('/ai/chat/conversations/:id/message', { preHandler: requirePermission('ai:read'), schema: { body: sendMessageSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof sendMessageSchema>;
    return chatService.send({
      organizationId: auth.org,
      conversationId: id,
      message: body.message,
      userId: auth.sub,
      supplierId: body.supplierId,
      auditId: body.auditId,
      useRag: body.useRag,
      systemPromptOverride: body.systemPrompt,
    });
  });

  const chatConversationSchema = z.object({
    title: z.string().min(1),
    type: z.string().optional(),
    category: z.string().optional(),
    participantIds: z.array(z.string().uuid()).optional(),
  });

  app.post('/chat/conversations', { preHandler: requirePermission('organization:read'), schema: { body: chatConversationSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof chatConversationSchema>;
    return communicationService.createConversation(auth.org, auth.sub, body);
  });

  app.get('/chat/conversations', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    return communicationService.listConversations(auth.org, auth.sub, {});
  });

  app.get('/chat/conversations/:id', { preHandler: requirePermission('organization:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return communicationService.getConversation(id);
  });

  app.post('/chat/conversations/:id/archive', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return communicationService.archiveConversation(auth.org, id);
  });

  app.get('/chat/inbox', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    return communicationService.getInbox(auth.org, auth.sub);
  });
}
