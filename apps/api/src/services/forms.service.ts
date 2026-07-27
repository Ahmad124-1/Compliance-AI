import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerFormRepo } from '../repositories/worker-form.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const formsService = {
  async list(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerFormRepo.findByUserId(orgId, userId);
  },

  async get(orgId: string, id: string) {
    const form = await workerFormRepo.findById(orgId, id);
    if (!form) throw new NotFoundError('Form not found');
    return form;
  },

  async submit(orgId: string, userId: string, input: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const form = await workerFormRepo.create({ organizationId: orgId, userId, ...(input as any) });
    await audit({ organizationId: orgId, actorId: userId, action: 'form.submit', entity: 'worker_form', entityId: form.id });
    return form;
  },

  async review(orgId: string, id: string, reviewedById: string, status: string, notes?: string | null) {
    const form = await workerFormRepo.updateStatus(orgId, id, status, reviewedById, notes);
    if (!form) throw new NotFoundError('Form not found');
    await audit({ organizationId: orgId, actorId: reviewedById, action: 'form.review', entity: 'worker_form', entityId: id, metadata: { status } });
    return form;
  },
};
