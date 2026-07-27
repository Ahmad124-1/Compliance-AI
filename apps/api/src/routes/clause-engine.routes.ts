import type { FastifyInstance } from 'fastify';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { clauseEngineService } from '../modules/clause-engine/index.js';

export async function clauseEngineRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/ai/clauses/search', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { query: string };
    return clauseEngineService.searchClauses(auth.org, q.query);
  });

  app.get('/ai/clauses/:standardId/:clauseId', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { standardId, clauseId } = req.params as { standardId: string; clauseId: string };
    return clauseEngineService.getClause(standardId, clauseId);
  });

  app.post('/ai/clauses/:clauseId/explain', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { clauseId } = req.params as { clauseId: string };
    return clauseEngineService.explainClause(auth.org, clauseId);
  });
}
