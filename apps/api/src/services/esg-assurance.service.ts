import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgAssuranceRepo } from '../repositories/esg-assurance.repo.js';

export const esgAssuranceService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const assurances = await esgAssuranceRepo.listByOrganization(orgId, {
      reportId: filter.reportId as string | undefined,
      disclosureId: filter.disclosureId as string | undefined,
      assuranceType: filter.assuranceType as string | undefined,
      status: filter.status as string | undefined,
    });
    return { assurances, total: assurances.length };
  },

  async get(orgId: string, id: string) {
    const assurance = await esgAssuranceRepo.findById(id, orgId);
    if (!assurance) throw new NotFoundError('ESG assurance record not found');
    return assurance;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const assurance = await esgAssuranceRepo.create({
      organizationId: orgId,
      reportId: input.reportId as string | undefined,
      disclosureId: input.disclosureId as string | undefined,
      assuranceType: input.assuranceType as string,
      scopeDescription: input.scopeDescription as string,
      providerName: input.providerName as string | undefined,
      providerEmail: input.providerEmail as string | undefined,
      assuranceDate: input.assuranceDate as string | undefined,
      assignedTo: input.assignedTo as string | undefined,
    });
    await audit({ action: 'esg.assurance.create', entity: 'esg_assurance', entityId: assurance.id });
    return assurance;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.status !== undefined) patch.status = input.status;
    if (input.findings !== undefined) patch.findings = input.findings;
    if (input.conclusion !== undefined) patch.conclusion = input.conclusion;
    if (input.opinionType !== undefined) patch.opinionType = input.opinionType;
    if (input.assuranceDate !== undefined) patch.assuranceDate = input.assuranceDate;
    if (input.evidenceReferences !== undefined) patch.evidenceReferences = input.evidenceReferences;
    const assurance = await esgAssuranceRepo.update(id, orgId, patch);
    if (!assurance) throw new NotFoundError('ESG assurance record not found');
    await audit({ action: 'esg.assurance.update', entity: 'esg_assurance', entityId: id });
    return assurance;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgAssuranceRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG assurance record not found');
    await esgAssuranceRepo.softDelete(id, orgId);
    await audit({ action: 'esg.assurance.delete', entity: 'esg_assurance', entityId: id });
    return { success: true };
  },
};
