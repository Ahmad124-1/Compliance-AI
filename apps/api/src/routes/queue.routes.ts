import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { queueService } from '../services/queue.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const enqueueSchema = z.object({
  queueName: z.string().min(1),
  jobType: z.string().min(1),
  payload: z.record(z.any()).optional(),
  priority: z.number().int().optional(),
  maxAttempts: z.number().int().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function queueRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/queue/jobs', { preHandler: requirePermission('queue:create'), schema: { body: enqueueSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof enqueueSchema>;
    return queueService.enqueue({
      organizationId: auth.org,
      queueName: body.queueName,
      jobType: body.jobType,
      payload: body.payload ?? {},
      priority: body.priority,
      maxAttempts: body.maxAttempts,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
  });

  app.get('/queue/jobs', { preHandler: requirePermission('queue:read') }, async (req) => {
    const q = req.query as { queueName?: string; status?: string; limit?: string; offset?: string };
    return queueService.listJobs({
      queueName: q.queueName,
      status: q.status,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
  });

  app.get('/queue/jobs/:id', { preHandler: requirePermission('queue:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return queueService.getJob(id);
  });

  app.post('/queue/:queueName/dequeue', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { queueName } = req.params as { queueName: string };
    return queueService.dequeue(queueName);
  });

  app.post('/queue/jobs/:id/retry', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return queueService.retryJob(id);
  });

  app.post('/queue/jobs/:id/cancel', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return queueService.cancelJob(id);
  });

  app.post('/queue/jobs/:id/dead-letter', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return queueService.markDeadLetter(id);
  });

  app.post('/queue/jobs/:id/process-dead-letter', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return queueService.processDeadLetter(id);
  });

  app.get('/queue/stats', { preHandler: requirePermission('queue:read') }, async (req) => {
    const q = req.query as { queueName?: string };
    return queueService.getQueueStats(q.queueName);
  });

  app.post('/queue/cleanup', { preHandler: requirePermission('queue:update') }, async (req) => {
    const { olderThan } = req.body as { olderThan?: string };
    return queueService.cleanupCompleted(olderThan ? new Date(olderThan) : undefined);
  });
}
