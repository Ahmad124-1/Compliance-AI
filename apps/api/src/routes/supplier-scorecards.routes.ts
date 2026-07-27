import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierScorecardService } from '../services/supplier-scorecards.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const scorecardCreateSchema = z.object({
  supplierId: z.string().uuid(),
  assessmentPeriod: z.string().optional(),
  overallEsgScore: z.number().min(0).max(100).optional(),
  environmentalScore: z.number().min(0).max(100).optional(),
  socialScore: z.number().min(0).max(100).optional(),
  governanceScore: z.number().min(0).max(100).optional(),
  complianceScore: z.number().min(0).max(100).optional(),
  carbonScore: z.number().min(0).max(100).optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

export async function supplierScorecardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/scorecards', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string };
    const scorecards = await supplierScorecardService.getScorecards(auth.org, q.supplierId);
    return { scorecards, total: scorecards.length };
  });

  app.get('/suppliers/scorecards/latest/:supplierId', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { supplierId } = req.params as { supplierId: string };
    return supplierScorecardService.getLatestScorecard(auth.org, supplierId);
  });

  app.get('/suppliers/scorecards/benchmark', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierScorecardService.getBenchmark(auth.org);
  });

  app.post('/suppliers/scorecards', { preHandler: requirePermission('suppliers:write'), schema: { body: scorecardCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof scorecardCreateSchema>;
    return supplierScorecardService.generateScorecard(auth.org, body.supplierId, body, auth.sub);
  });

  app.delete('/suppliers/scorecards/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierScorecardService.deleteScorecard(id, auth.org, auth.sub);
    return { success: true };
  });
}