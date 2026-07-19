import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { queueJobRepo } from '../repositories/queue-job.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface EnqueueInput {
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  organizationId?: string;
  scheduledAt?: Date;
}

export const queueService = {
  async enqueue(input: EnqueueInput) {
    const orgId = input.organizationId;
    if (orgId) {
      const org = await organizationRepo.findById(orgId);
      if (!org) throw new NotFoundError('Organization not found');
    }
    const job = await queueJobRepo.create(input);
    await audit({ organizationId: orgId ?? null, action: 'queue.enqueue', entity: 'queue_job', entityId: job.id, metadata: { queueName: input.queueName, jobType: input.jobType } });
    return job;
  },

  async dequeue(queueName) {
    const pending = await queueJobRepo.findOldestPending(queueName);
    if (pending.length === 0) return null;
    const job = pending[0];
    const updated = await queueJobRepo.update(job.id, { status: 'processing', startedAt: new Date() });
    await audit({ organizationId: updated.organizationId ?? null, action: 'queue.dequeue', entity: 'queue_job', entityId: updated.id });
    return updated;
  },

  async getJob(id) {
    return queueJobRepo.findById(id);
  },

  async listJobs(filters: any = {}) {
    return queueJobRepo.list(filters);
  },

  async retryJob(id) {
    const job = await queueJobRepo.findById(id);
    if (!job) throw new NotFoundError('Job not found');
    const updated = await queueJobRepo.update(id, { status: 'pending', attempts: 0, lastError: null, startedAt: null, failedAt: null });
    await audit({ organizationId: updated.organizationId ?? null, action: 'queue.retry', entity: 'queue_job', entityId: id });
    return updated;
  },

  async cancelJob(id) {
    const job = await queueJobRepo.findById(id);
    if (!job) throw new NotFoundError('Job not found');
    const updated = await queueJobRepo.update(id, { status: 'cancelled', completedAt: new Date() });
    await audit({ organizationId: updated.organizationId ?? null, action: 'queue.cancel', entity: 'queue_job', entityId: id });
    return updated;
  },

  async markDeadLetter(id) {
    const job = await queueJobRepo.findById(id);
    if (!job) throw new NotFoundError('Job not found');
    const updated = await queueJobRepo.update(id, { status: 'dead_letter', failedAt: new Date() });
    await audit({ organizationId: updated.organizationId ?? null, action: 'queue.dead_letter', entity: 'queue_job', entityId: id });
    return updated;
  },

  async processDeadLetter(id) {
    const job = await queueJobRepo.findById(id);
    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'dead_letter') throw new NotFoundError('Job is not in dead letter state');
    const updated = await queueJobRepo.update(id, { status: 'pending', attempts: 0, lastError: null, failedAt: null });
    await audit({ organizationId: updated.organizationId ?? null, action: 'queue.process_dead_letter', entity: 'queue_job', entityId: id });
    return updated;
  },

  async getQueueStats(queueName?) {
    return queueJobRepo.getStats(queueName);
  },

  async cleanupCompleted(olderThan) {
    const deletedIds = await queueJobRepo.cleanupCompleted(olderThan);
    return { deletedIds, count: deletedIds.length };
  },
};
