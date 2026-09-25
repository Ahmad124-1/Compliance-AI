import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth } from './guard.js';
import {
  ReferenceDataServiceInstance,
  ActivityServiceInstance,
  ImportServiceInstance,
  ValidationServiceInstance,
  DocumentServiceInstance,
  DataHubServiceInstance,
  PropagationServiceInstance,
  ReportAggregationServiceInstance,
  AIExtractionServiceInstance,
} from '../services/data-hub.service.js';
import { query } from '../db/pool.js';
import { SmartImportEngineInstance, SmartImportJobQueueInstance } from '../services/smart-import.service.js';

const EMPTY_ENTITY_TYPES = [
  'facilities',
  'sites',
  'departments',
  'suppliers',
  'programs',
  'goals',
  'kpis',
  'emission_factors',
  'standards',
];

const importCreateSchema = z.object({
  importType: z.string().min(1),
  entityType: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  records: z.array(z.record(z.string(), z.unknown())).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const importCommitSchema = z.object({
  entityType: z.string().optional(),
});

const documentCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  linkTo: z
    .array(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        linkType: z.string().optional(),
      }),
    )
    .default([]),
});

const validationReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'edit', 'merge', 'ignore']),
  note: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function dataHubRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/data-hub/dashboard
  app.get(
    '/data-hub/dashboard',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const dashboard = await DataHubServiceInstance.getDashboard(claims.org);
      return reply.send(dashboard);
    },
  );

  // GET /api/v1/data-hub/master-data
  app.get(
    '/data-hub/master-data',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const masterData = await ReferenceDataServiceInstance.getMasterData(claims.org);
      return reply.send(masterData);
    },
  );

  // POST /api/v1/data-hub/import
  app.post(
    '/data-hub/import',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = importCreateSchema.parse(request.body);
      const job = await ImportServiceInstance.createImportJob(claims.org, claims.sub, body);
      return reply.code(201).send(job);
    },
  );

  // POST /api/v1/data-hub/import/preview
  app.post(
    '/data-hub/import/preview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = z.object({ importJobId: z.string().uuid() }).parse(request.body);
      const preview = await ImportServiceInstance.preview(claims.org, body.importJobId);
      return reply.send(preview);
    },
  );

  // POST /api/v1/data-hub/import/commit
  app.post(
    '/data-hub/import/commit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = z
        .object({ importJobId: z.string().uuid() })
        .merge(importCommitSchema)
        .parse(request.body);
      const job = await ImportServiceInstance.commitJob(claims.org, claims.sub, body.importJobId, {
        entityType: body.entityType,
      });
      return reply.send(job);
    },
  );

  // GET /api/v1/data-hub/documents
  app.get(
    '/data-hub/documents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const category = (request.query as { category?: string }).category;
      const documents = await DocumentServiceInstance.list(claims.org, category);
      return reply.send(documents);
    },
  );

  // POST /api/v1/data-hub/documents
  app.post(
    '/data-hub/documents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = documentCreateSchema.parse(request.body);
      const document = await DocumentServiceInstance.create(claims.org, claims.sub, body);
      return reply.code(201).send(document);
    },
  );

  // GET /api/v1/data-hub/validation
  app.get(
    '/data-hub/validation',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const { status, entityType } = request.query as { status?: string; entityType?: string };
      let items = await ValidationServiceInstance.list(claims.org, status, 200);
      if (entityType) {
        items = items.filter((item) => item.entityType === entityType);
      }
      return reply.send(items);
    },
  );

  // PATCH /api/v1/data-hub/validation/:id
  app.patch(
    '/data-hub/validation/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = validationReviewSchema.parse(request.body);
      const item = await ValidationServiceInstance.review(claims.org, claims.sub, params.id, body.action, {
        note: body.note,
        data: body.data,
      });
      return reply.send(item);
    },
  );

  // GET /api/v1/data-hub/activity
  app.get(
    '/data-hub/activity',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const limitRaw = Number((request.query as { limit?: string }).limit);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;
      const activity = await ActivityServiceInstance.list(claims.org, limit);
      return reply.send(activity);
    },
  );

  // GET /api/v1/data-hub/statistics
  app.get(
    '/data-hub/statistics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const statistics = await DataHubServiceInstance.getStatistics(claims.org);
      return reply.send(statistics);
    },
  );

  // GET /api/v1/data-hub/queue
  app.get(
    '/data-hub/queue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const queue = await DataHubServiceInstance.getQueue(claims.org);
      return reply.send(queue);
    },
  );

  // Extension endpoints (utility / future AI)
  app.get(
    '/data-hub/settings',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const capabilities = await AIExtractionServiceInstance.getCapabilities();
      const dimensions = await ReportAggregationServiceInstance.getAvailableDimensions(claims.org);
      return reply.send({
        entityTypes: EMPTY_ENTITY_TYPES,
        aiExtraction: { capabilities, enabled: capabilities.length > 0 },
        reportAggregation: dimensions,
        validationActions: ['approve', 'reject', 'edit', 'merge', 'ignore'],
        importStatuses: ['uploaded', 'queued', 'running', 'completed', 'failed', 'retry', 'cancelled', 'committed'],
      });
    },
  );

  app.post(
    '/data-hub/settings/synchronize',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = z
        .object({
          entityType: z.string().min(1),
          entityId: z.string().uuid(),
          entityName: z.string().min(1),
        })
        .parse(request.body);
      const result = await PropagationServiceInstance.synchronize(claims.org, claims.sub, body.entityType, body.entityId, body.entityName);
      return reply.send(result);
    },
  );

  // POST /api/v1/data-hub/import/validate
  app.post(
    '/data-hub/import/validate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const body = z
        .object({
          importJobId: z.string().uuid(),
          entityType: z.string().min(1),
          records: z.array(z.record(z.string(), z.unknown())).default([]),
        })
        .parse(request.body);
      const report = await SmartImportEngineInstance.validateRecords(claims.org, body.entityType, body.records);
      return reply.send(report);
    },
  );

  // GET /api/v1/data-hub/import/jobs
  app.get(
    '/data-hub/import/jobs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const { status } = request.query as { status?: string };
      const jobs = await ImportServiceInstance.listJobs(claims.org, status);
      return reply.send(jobs);
    },
  );

  // GET /api/v1/data-hub/import/jobs/:id
  app.get(
    '/data-hub/import/jobs/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await query(
        `SELECT * FROM data_hub_import_jobs WHERE id = $1 AND organization_id = $2`,
        [params.id, claims.org],
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Import job not found', reason: 'The import job does not exist or is not in your organization.', suggestedFix: 'Check the job ID and try again.' });
      }
      const job = result.rows[0];
      const progress = await SmartImportEngineInstance.listProgress(claims.org, params.id);
      const duplicates = await query(
        `SELECT * FROM data_hub_import_duplicates WHERE import_job_id = $1 AND organization_id = $2`,
        [params.id, claims.org],
      );
      return reply.send({ job, progress, duplicates: duplicates.rows });
    },
  );

  // POST /api/v1/data-hub/import/jobs/:id/retry
  app.post(
    '/data-hub/import/jobs/:id/retry',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await query(
        `SELECT * FROM data_hub_import_jobs WHERE id = $1 AND organization_id = $2`,
        [params.id, claims.org],
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Import job not found', reason: 'The import job does not exist or is not in your organization.', suggestedFix: 'Check the job ID and try again.' });
      }
      const job = result.rows[0];
      if (job.status !== 'failed' && job.status !== 'cancelled') {
        return reply.code(400).send({ error: 'Job not retryable', reason: `Job status is "${job.status}". Only failed or cancelled jobs can be retried.`, suggestedFix: 'Wait for the job to finish or cancel it first.' });
      }
      await query(
        `UPDATE data_hub_import_jobs SET status = 'queued', last_error = NULL, progress = 0, updated_at = now() WHERE id = $1`,
        [params.id],
      );
      await ActivityServiceInstance.log(claims.org, claims.sub, 'import.retry', { type: 'import_job', id: params.id }, {});
      return reply.send({ ok: true, message: 'Import job queued for retry.' });
    },
  );

  // DELETE /api/v1/data-hub/import/jobs/:id (cancel)
  app.delete(
    '/data-hub/import/jobs/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const claims = getAuth(request);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await query(
        `SELECT * FROM data_hub_import_jobs WHERE id = $1 AND organization_id = $2`,
        [params.id, claims.org],
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Import job not found', reason: 'The import job does not exist or is not in your organization.', suggestedFix: 'Check the job ID and try again.' });
      }
      const job = result.rows[0];
      if (job.status === 'running' || job.status === 'queued') {
        SmartImportJobQueueInstance.cancel(params.id);
        await query(
          `UPDATE data_hub_import_jobs SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = $1`,
          [params.id],
        );
        await ActivityServiceInstance.log(claims.org, claims.sub, 'import.cancel', { type: 'import_job', id: params.id }, {});
        return reply.send({ ok: true, message: 'Import job cancelled.' });
      }
      return reply.code(400).send({ error: 'Job not cancellable', reason: `Job status is "${job.status}". Only queued or running jobs can be cancelled.`, suggestedFix: 'Wait for the job to complete or fail.' });
    },
  );
}
