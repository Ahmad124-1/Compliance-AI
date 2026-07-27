import type { FastifyInstance } from 'fastify';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { copilotService } from '../modules/ai-copilot/index.js';

export async function aiCopilotRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/ai/copilot/health', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return copilotService.getHealth(auth.org);
  });

  app.get('/ai/copilot/overview', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return copilotService.getOverview(auth.org);
  });
}
