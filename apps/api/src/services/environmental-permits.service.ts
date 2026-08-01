import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { permitRepo } from '../repositories/permit.repo.js';
import { airEmissionLimitRepo } from '../repositories/air-emission-limit.repo.js';

export const environmentalPermitsService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    return permitRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      siteId: filter.siteId as string | undefined,
      permitType: filter.permitType as any,
      status: filter.status as any,
      expiringSoon: filter.expiringSoon === 'true' || filter.expiringSoon === '1',
    });
  },
  async get(orgId: string, id: string) {
    const permit = await permitRepo.findById(id, orgId);
    if (!permit) throw new NotFoundError('Permit not found');
    return permit;
  },
  async create(orgId: string, input: Record<string, unknown>, userId?: string) {
    const permit = await permitRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      permitType: input.permitType as any,
      permitNumber: input.permitNumber as string,
      issuingAuthority: input.issuingAuthority as string,
      issueDate: input.issueDate as string,
      expiryDate: input.expiryDate as string,
      renewalDate: input.renewalDate as string | undefined,
      status: input.status as any,
      conditions: input.conditions as string | undefined,
      supportingDocuments: input.supportingDocuments as string[] | undefined,
      approvalHistory: input.approvalHistory as Record<string, unknown>[] | undefined,
      responsiblePersonId: input.responsiblePersonId as string | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'permit.create', entity: 'permit', entityId: permit.id, organizationId: orgId, actorId: userId });
    return permit;
  },
  async update(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['permitType','permitNumber','issuingAuthority','issueDate','expiryDate','renewalDate','status','conditions','supportingDocuments','approvalHistory','responsiblePersonId','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const permit = await permitRepo.update(id, orgId, patch as any);
    if (!permit) throw new NotFoundError('Permit not found');
    await audit({ action: 'permit.update', entity: 'permit', entityId: id, organizationId: orgId, actorId: userId });
    return permit;
  },
  async delete(orgId: string, id: string, userId?: string) {
    const existing = await permitRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Permit not found');
    await permitRepo.softDelete(id, orgId);
    await audit({ action: 'permit.delete', entity: 'permit', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  async getUpcomingRenewals(orgId: string, days: number = 30) {
    const permits = await permitRepo.listByOrganization(orgId, { expiringSoon: true });
    return permits;
  },

  async getExpired(orgId: string) {
    const permits = await permitRepo.listByOrganization(orgId, { status: 'expired' });
    return permits;
  },
};
