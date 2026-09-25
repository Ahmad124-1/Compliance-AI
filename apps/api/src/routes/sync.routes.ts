import type { FastifyInstance } from 'fastify';

import { authenticate, getAuth } from './guard.js';
import { syncEngineService } from '../services/sync-engine.service.js';

/**
 * PHASE 4 — SPRINT 4.3: SYNCHRONIZATION ENGINE
 *
 * POST /sync/run      — trigger a synchronization job (manual or background)
 * GET  /sync/status   — synchronization status per entity type
 * GET  /sync/logs     — recent sync activity log
 * POST /sync/retry    — retry a failed or conflicted job
 *
 * All routes are organization-scoped and require authentication.
 */
export async function syncRoutes(app: FastifyInstance): Promise<void> {
  // -------------------------------------------------------------------
  // POST /sync/run
  // -------------------------------------------------------------------
  app.post(
    '/sync/run',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = (request.body ?? {}) as {
        entityType?: string;
        entityId?: string;
        jobType?: string;
      };

      try {
        const result = await syncEngineService.run(claims.org, claims.sub, {
          entityType: body.entityType as never,
          entityId: body.entityId,
          jobType: body.jobType as never,
        });
        return reply.code(200).send({ success: true, data: result });
      } catch (err) {
        return reply.code(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Sync run failed',
        });
      }
    },
  );

  // -------------------------------------------------------------------
  // GET /sync/status
  // -------------------------------------------------------------------
  app.get(
    '/sync/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const status = await syncEngineService.getStatus(claims.org);
      return reply.code(200).send({ success: true, data: status });
    },
  );

  // -------------------------------------------------------------------
  // GET /sync/logs
  // -------------------------------------------------------------------
  app.get(
    '/sync/logs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const query = request.query as { limit?: string };
      const limit = Math.min(Math.max(Number(query.limit ?? 100), 1), 500);
      const logs = await syncEngineService.getLogs(claims.org, limit);
      return reply.code(200).send({ success: true, data: logs });
    },
  );

  // -------------------------------------------------------------------
  // POST /sync/retry
  // -------------------------------------------------------------------
  app.post(
    '/sync/retry',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = (request.body ?? {}) as { jobId?: string };
      if (!body.jobId) {
        return reply.code(400).send({ success: false, error: 'jobId is required' });
      }
      try {
        const result = await syncEngineService.retry(claims.org, claims.sub, body.jobId);
        if (!result) {
          return reply.code(404).send({ success: false, error: 'Job not found' });
        }
        return reply.code(200).send({ success: true, data: result });
      } catch (err) {
        return reply.code(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Retry failed',
        });
      }
    },
  );

  // -------------------------------------------------------------------
  // POST /sync/documents/resolve — duplicate-safe document resolution
  // -------------------------------------------------------------------
  app.post(
    '/sync/documents/resolve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = (request.body ?? {}) as {
        fileName?: string;
        fileUrl?: string;
        title?: string;
        fileHash?: string;
      };
      try {
        const result = await syncEngineService.resolveDocument(claims.org, body);
        return reply.code(200).send({ success: true, data: result });
      } catch (err) {
        return reply.code(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Document resolution failed',
        });
      }
    },
  );

  // -------------------------------------------------------------------
  // POST /sync/documents/link — link a document to an entity
  // -------------------------------------------------------------------
  app.post(
    '/sync/documents/link',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = (request.body ?? {}) as {
        documentId?: string;
        entityType?: string;
        entityId?: string;
      };
      if (!body.documentId || !body.entityType) {
        return reply.code(400).send({ success: false, error: 'documentId and entityType are required' });
      }
      try {
        const result = await syncEngineService.linkDocument(claims.org, claims.sub, {
          documentId: body.documentId,
          entityType: body.entityType,
          entityId: body.entityId,
        });
        return reply.code(200).send({ success: true, data: result });
      } catch (err) {
        return reply.code(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Document link failed',
        });
      }
    },
  );

  // -------------------------------------------------------------------
  // GET /sync/documents?entityType=&entityId= — linked documents
  // -------------------------------------------------------------------
  app.get(
    '/sync/documents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const query = request.query as { entityType?: string; entityId?: string };
      if (!query.entityType) {
        return reply.code(400).send({ success: false, error: 'entityType is required' });
      }
      const docs = await syncEngineService.linkedDocuments(claims.org, query.entityType, query.entityId);
      return reply.code(200).send({ success: true, data: docs });
    },
  );
}