import type { FastifyInstance } from 'fastify';

import { securityService } from '../services/security.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function securityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/security/review', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    return securityService.review(auth.org);
  });
}
