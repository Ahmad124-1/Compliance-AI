import type { FastifyInstance } from 'fastify';

import { complianceService } from '../services/compliance.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function complianceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/compliance/status', { preHandler: requirePermission('compliance:read', 'analytics:read') }, async (req) => {
    const auth = getAuth(req);
    return complianceService.getStatus(auth.org);
  });
}

