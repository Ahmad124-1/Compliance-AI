import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerTaskRepo } from '../repositories/worker-task.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const tasksService = {
  async list(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerTaskRepo.findByUserId(orgId, userId);
  },

  async get(orgId: string, id: string) {
    const task = await workerTaskRepo.findById(orgId, id);
    if (!task) throw new NotFoundError('Task not found');
    return task;
  },

  async create(orgId: string, userId: string, input: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const task = await workerTaskRepo.create({ organizationId: orgId, userId, ...(input as any) });
    await audit({ organizationId: orgId, actorId: userId, action: 'task.create', entity: 'worker_task', entityId: task.id });
    return task;
  },

  async complete(orgId: string, id: string) {
    const task = await workerTaskRepo.updateStatus(orgId, id, 'completed');
    if (!task) throw new NotFoundError('Task not found');
    await audit({ organizationId: orgId, action: 'task.complete', entity: 'worker_task', entityId: id });
    return task;
  },
};
