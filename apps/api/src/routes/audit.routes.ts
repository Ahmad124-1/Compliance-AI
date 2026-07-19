import type { FastifyInstance } from 'fastify';

import { auditService } from '../services/audit.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/audit/logs', { preHandler: requirePermission('audit:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as {
      actorId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      severity?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: string;
      offset?: string;
    };
    return auditService.list(auth.org, {
      actorId: q.actorId,
      action: q.action,
      entity: q.entity,
      entityId: q.entityId,
      severity: q.severity,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      limit: q.limit ? parseInt(q.limit, 10) : 50,
      offset: q.offset ? parseInt(q.offset, 10) : 0,
    });
  });

  app.get('/audit/logs/:id', { preHandler: requirePermission('audit:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return auditService.get(auth.org, id);
  });

  app.get('/audit/actions', { preHandler: requirePermission('audit:read') }, async (req) => {
    const auth = getAuth(req);
    return { actions: await auditService.actions(auth.org) };
  });

  app.get('/audit/export', { preHandler: requirePermission('audit:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { dateFrom?: string; dateTo?: string; action?: string; limit?: string };
    const logs = await auditService.exportLogs(auth.org, {
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      action: q.action,
      limit: q.limit ? parseInt(q.limit, 10) : 10_000,
    });
    return { logs, total: logs.length };
  });
}
