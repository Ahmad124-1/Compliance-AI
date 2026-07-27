import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgFrameworkRepo } from '../repositories/esg-framework.repo.js';

export const esgFrameworkService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const frameworks = await esgFrameworkRepo.listByOrganization(orgId, {
      search: filter.search as string | undefined,
      frameworkCode: filter.frameworkCode as string | undefined,
      isActive: filter.isActive !== undefined ? (filter.isActive as boolean) : undefined,
    });
    return { frameworks, total: frameworks.length };
  },

  async get(orgId: string, id: string) {
    const framework = await esgFrameworkRepo.findById(id, orgId);
    if (!framework) throw new NotFoundError('ESG framework not found');
    return framework;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const framework = await esgFrameworkRepo.create({
      organizationId: orgId,
      name: input.name as string,
      description: input.description as string | undefined,
      frameworkCode: input.frameworkCode as string,
      version: input.version as string | undefined,
      issuingBody: input.issuingBody as string | undefined,
      effectiveDate: input.effectiveDate as string | undefined,
      categories: (input.categories as Record<string, unknown>[]) ?? [],
    });
    await audit({ action: 'esg.framework.create', entity: 'esg_framework', entityId: framework.id });
    return framework;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.version !== undefined) patch.version = input.version;
    if (input.issuingBody !== undefined) patch.issuingBody = input.issuingBody;
    if (input.effectiveDate !== undefined) patch.effectiveDate = input.effectiveDate;
    if (input.categories !== undefined) patch.categories = input.categories;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const framework = await esgFrameworkRepo.update(id, orgId, patch);
    if (!framework) throw new NotFoundError('ESG framework not found');
    await audit({ action: 'esg.framework.update', entity: 'esg_framework', entityId: id });
    return framework;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgFrameworkRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG framework not found');
    await esgFrameworkRepo.softDelete(id, orgId);
    await audit({ action: 'esg.framework.delete', entity: 'esg_framework', entityId: id });
    return { success: true };
  },
};
