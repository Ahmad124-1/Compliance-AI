import { NotFoundError, BadRequestError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sdgMappingRepo } from '../repositories/sdg-mapping.repo.js';

const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
  5: 'Gender Equality', 6: 'Clean Water', 7: 'Affordable Energy', 8: 'Decent Work',
  9: 'Industry Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
  12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
  15: 'Life on Land', 16: 'Peace Justice', 17: 'Partnerships',
};

export const sdgMapperService = {
  async create(orgId: string, input: { sdgId: number; entityType: string; entityId: string; contributionPct?: number; description?: string }) {
    if (input.sdgId < 1 || input.sdgId > 17) throw new BadRequestError('SDG ID must be between 1 and 17');
    const mapping = await sdgMappingRepo.create({ ...input, organizationId: orgId });
    await audit({ action: 'sustainability.sdg.create', entity: 'sdg_mapping', entityId: mapping.id });
    return mapping;
  },

  async listByEntity(orgId: string, entityType: string, entityId: string) {
    return sdgMappingRepo.listByEntity(entityType, entityId, orgId);
  },

  async listByOrganization(orgId: string, filter?: { entityType?: string; entityId?: string; sdgId?: number }) {
    return sdgMappingRepo.listByOrganization(orgId, filter);
  },

  async getContribution(orgId: string) {
    return sdgMappingRepo.getSdgContribution(orgId);
  },

  async delete(orgId: string, id: string) {
    const existing = await sdgMappingRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('SDG mapping not found');
    await sdgMappingRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.sdg.delete', entity: 'sdg_mapping', entityId: id });
    return { success: true };
  },

  getSdgName(sdgId: number): string {
    return SDG_NAMES[sdgId] ?? `SDG ${sdgId}`;
  },

  getSdgList(): { id: number; name: string }[] {
    return Object.entries(SDG_NAMES).map(([id, name]) => ({ id: parseInt(id, 10), name }));
  },
};