import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { searchService } from '../services/search.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const saveSchema = z.object({
  name: z.string().min(1),
  scope: z.string().min(1),
  query: z.string().default(''),
  filters: z.record(z.any()).optional(),
  isGlobal: z.boolean().optional(),
});

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/search', { preHandler: requirePermission('search:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string>;
    const filters = {
      status: q.status,
      priority: q.priority,
      severity: q.severity,
      category: q.category,
      source: q.source,
      anonymous: q.anonymous ? q.anonymous === 'true' : undefined,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      factoryId: q.factoryId,
      departmentId: q.departmentId,
      assignedTo: q.assignedTo,
    };
    return searchService.globalSearch({
      organizationId: auth.org,
      userId: auth.sub,
      scope: (q.scope as any) ?? 'all',
      term: q.term,
      filters,
      sortField: (q.sortField as any) ?? 'relevance',
      sortDir: (q.sortDir as any) ?? 'desc',
      limit: q.limit ? parseInt(q.limit, 10) : 25,
      offset: q.offset ? parseInt(q.offset, 10) : 0,
      record: true,
    });
  });

  app.get('/search/saved', { preHandler: requirePermission('search:read') }, async (req) => {
    const auth = getAuth(req);
    return searchService.listSaved(auth.org, auth.sub);
  });

  app.post('/search/saved', { preHandler: requirePermission('search:create'), schema: { body: saveSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof saveSchema>;
    return searchService.save(auth.org, auth.sub, body);
  });

  app.delete('/search/saved/:id', { preHandler: requirePermission('search:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await searchService.deleteSaved(auth.org, auth.sub, id);
    return { success: true };
  });

  app.get('/search/recent', { preHandler: requirePermission('search:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { limit?: string };
    return searchService.listRecent(auth.org, auth.sub, q.limit ? parseInt(q.limit, 10) : 10);
  });

  app.delete('/search/recent', { preHandler: requirePermission('search:delete') }, async (req) => {
    const auth = getAuth(req);
    await searchService.clearRecent(auth.org, auth.sub);
    return { success: true };
  });
}
