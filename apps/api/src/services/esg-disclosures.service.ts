import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgDisclosureRepo } from '../repositories/esg-disclosure.repo.js';

export const esgDisclosureService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const disclosures = await esgDisclosureRepo.listByOrganization(orgId, {
      periodId: filter.periodId as string | undefined,
      frameworkId: filter.frameworkId as string | undefined,
      pillar: filter.pillar as string | undefined,
      status: filter.status as string | undefined,
      assuranceStatus: filter.assuranceStatus as string | undefined,
    });
    return { disclosures, total: disclosures.length };
  },

  async get(orgId: string, id: string) {
    const disclosure = await esgDisclosureRepo.findById(id, orgId);
    if (!disclosure) throw new NotFoundError('ESG disclosure not found');
    return disclosure;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const disclosure = await esgDisclosureRepo.create({
      organizationId: orgId,
      frameworkId: input.frameworkId as string | undefined,
      metricId: input.metricId as string | undefined,
      periodId: input.periodId as string,
      name: input.name as string,
      description: input.description as string | undefined,
      category: input.category as string,
      pillar: input.pillar as string,
      content: (input.content as Record<string, unknown>) ?? {},
      summary: input.summary as string | undefined,
      pageReference: input.pageReference as string | undefined,
      linkedDocuments: (input.linkedDocuments as string[]) ?? [],
      dataPoints: (input.dataPoints as string[]) ?? [],
    });
    await audit({ action: 'esg.disclosure.create', entity: 'esg_disclosure', entityId: disclosure.id });
    return disclosure;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.content !== undefined) patch.content = input.content;
    if (input.summary !== undefined) patch.summary = input.summary;
    if (input.pageReference !== undefined) patch.pageReference = input.pageReference;
    if (input.linkedDocuments !== undefined) patch.linkedDocuments = input.linkedDocuments;
    if (input.dataPoints !== undefined) patch.dataPoints = input.dataPoints;
    if (input.assuranceStatus !== undefined) patch.assuranceStatus = input.assuranceStatus;
    if (input.submittedBy !== undefined) patch.submittedBy = input.submittedBy;
    if (input.submittedAt !== undefined) patch.submittedAt = input.submittedAt;
    if (input.reviewedBy !== undefined) patch.reviewedBy = input.reviewedBy;
    if (input.reviewedAt !== undefined) patch.reviewedAt = input.reviewedAt;
    if (input.approvedBy !== undefined) patch.approvedBy = input.approvedBy;
    if (input.approvedAt !== undefined) patch.approvedAt = input.approvedAt;
    if (input.publishedAt !== undefined) patch.publishedAt = input.publishedAt;
    const disclosure = await esgDisclosureRepo.update(id, orgId, patch);
    if (!disclosure) throw new NotFoundError('ESG disclosure not found');
    await audit({ action: 'esg.disclosure.update', entity: 'esg_disclosure', entityId: id });
    return disclosure;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgDisclosureRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG disclosure not found');
    await esgDisclosureRepo.softDelete(id, orgId);
    await audit({ action: 'esg.disclosure.delete', entity: 'esg_disclosure', entityId: id });
    return { success: true };
  },
};
