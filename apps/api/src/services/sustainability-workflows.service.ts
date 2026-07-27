import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityApprovalRepo } from '../repositories/sustainability-approval.repo.js';

export const sustainabilityWorkflowService = {
  async createApproval(orgId: string, input: Record<string, unknown>) {
    const approval = await sustainabilityApprovalRepo.create({
      organizationId: orgId,
      entityType: input.entityType as string,
      entityId: input.entityId as string,
      submittedBy: input.submittedBy as string | undefined,
      dueDate: input.dueDate as string | undefined,
    });
    await audit({ action: 'sustainability.approval.create', entity: 'sustainability_approval', entityId: approval.id });
    return approval;
  },

  async listByEntity(orgId: string, entityType: string, entityId: string) {
    return sustainabilityApprovalRepo.listByEntity(entityType, entityId, orgId);
  },

  async listByOrganization(orgId: string, filter?: { status?: string; entityType?: string }) {
    return sustainabilityApprovalRepo.listByOrganization(orgId, filter);
  },

  async transition(orgId: string, id: string, status: string, reviewerId?: string, comments?: string) {
    const approval = await sustainabilityApprovalRepo.transition(id, orgId, status, reviewerId, comments);
    if (!approval) throw new NotFoundError('Approval not found');
    await audit({ action: 'sustainability.approval.transition', entity: 'sustainability_approval', entityId: id });
    return approval;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityApprovalRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Approval not found');
    await sustainabilityApprovalRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.approval.delete', entity: 'sustainability_approval', entityId: id });
    return { success: true };
  },
};

