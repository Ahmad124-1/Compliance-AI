import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { policyGeneratorService } from '../modules/policy-generator/index.js';

export async function policyGeneratorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const generateSchema = z.object({
    type: z.string().min(1),
    context: z.record(z.any()).optional(),
  });

  app.post('/ai/policies/generate', { preHandler: requirePermission('ai:update'), schema: { body: generateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof generateSchema>;
    return policyGeneratorService.generatePolicy(auth.org, auth.sub, body.type, body.context ?? {});
  });

  app.get('/ai/policies', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return policyGeneratorService.listPolicies(auth.org);
  });

  app.get('/ai/policies/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return policyGeneratorService.getPolicy(id);
  });

  const updateSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    type: z.string().optional(),
  });

  app.patch('/ai/policies/:id', { preHandler: requirePermission('ai:update'), schema: { body: updateSchema } }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof updateSchema>;
    return policyGeneratorService.updatePolicy(id, body);
  });

  app.post('/ai/policies/:id/approve', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return policyGeneratorService.approvePolicy(id, auth.sub);
  });

  const rejectSchema = z.object({
    reason: z.string().optional(),
  });

  app.post('/ai/policies/:id/reject', { preHandler: requirePermission('ai:update'), schema: { body: rejectSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof rejectSchema>;
    return policyGeneratorService.rejectPolicy(id, auth.sub, body.reason ?? '');
  });

  app.get('/ai/policies/:id/export', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { id } = req.params as { id: string };
    const q = req.query as { format?: string };
    return policyGeneratorService.exportPolicy(id, q.format ?? 'markdown');
  });
}
