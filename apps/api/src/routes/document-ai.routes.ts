import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { documentAiService } from '../modules/document-ai/index.js';

export async function documentAiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const uploadDocumentSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().min(0),
  });

  app.post('/ai/documents', { preHandler: requirePermission('ai:update'), schema: { body: uploadDocumentSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof uploadDocumentSchema>;
    return documentAiService.uploadDocument(auth.org, auth.sub, body.filename, body.contentType, body.sizeBytes);
  });

  app.post('/ai/documents/:id/process', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return documentAiService.processDocument(auth.org, id);
  });

  const analyzeSchema = z.object({
    action: z.string().min(1),
  });

  app.post('/ai/documents/:id/analyze', { preHandler: requirePermission('ai:read'), schema: { body: analyzeSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof analyzeSchema>;
    return documentAiService.analyze(auth.org, id, body.action);
  });

  app.get('/ai/documents', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return documentAiService.listDocuments(auth.org);
  });

  app.get('/ai/documents/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return documentAiService.getDocument(id);
  });
}
