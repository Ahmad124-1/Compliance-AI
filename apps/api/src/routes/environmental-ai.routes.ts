import type { FastifyInstance } from 'fastify';
import { environmentalAiService } from '../services/environmental-ai.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function environmentalAiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/environment/ai/insights', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalAiService.getEnvironmentalInsights(auth.org);
  });

  app.get('/environment/ai/executive-summary', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalAiService.getExecutiveSummary(auth.org);
  });
}
