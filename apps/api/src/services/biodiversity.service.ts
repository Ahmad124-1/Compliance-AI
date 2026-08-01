import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { biodiversityRepo } from '../repositories/biodiversity.repo.js';

export const biodiversityService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    return biodiversityRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      recordType: filter.recordType as string | undefined,
      status: filter.status as string | undefined,
      restorationStatus: filter.restorationStatus as string | undefined,
    });
  },
  async get(orgId: string, id: string) {
    const record = await biodiversityRepo.findById(id, orgId);
    if (!record) throw new NotFoundError('Biodiversity record not found');
    return record;
  },
  async create(orgId: string, input: Record<string, unknown>, userId?: string) {
    const record = await biodiversityRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      recordType: input.recordType as string,
      name: input.name as string,
      description: input.description as string | undefined,
      location: input.location as string | undefined,
      areaSize: input.areaSize as number | undefined,
      areaUnit: input.areaUnit as string | undefined,
      treesPlanted: input.treesPlanted as number | undefined,
      treesLost: input.treesLost as number | undefined,
      speciesCount: input.speciesCount as number | undefined,
      speciesList: input.speciesList as string[] | undefined,
      protectedSpecies: input.protectedSpecies as string[] | undefined,
      restorationArea: input.restorationArea as number | undefined,
      restorationStatus: input.restorationStatus as string | undefined,
      communityParticipants: input.communityParticipants as number | undefined,
      communityPartner: input.communityPartner as string | undefined,
      fundingAmount: input.fundingAmount as number | undefined,
      fundingSource: input.fundingSource as string | undefined,
      status: input.status as string | undefined,
      startDate: input.startDate as string | undefined,
      endDate: input.endDate as string | undefined,
      evidenceUrls: input.evidenceUrls as string[] | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'biodiversity.create', entity: 'biodiversity_record', entityId: record.id, organizationId: orgId, actorId: userId });
    return record;
  },
  async update(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','location','areaSize','areaUnit','treesPlanted','treesLost','speciesCount','speciesList','protectedSpecies','restorationArea','restorationStatus','communityParticipants','communityPartner','fundingAmount','fundingSource','status','startDate','endDate','evidenceUrls','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const record = await biodiversityRepo.update(id, orgId, patch as any);
    if (!record) throw new NotFoundError('Biodiversity record not found');
    await audit({ action: 'biodiversity.update', entity: 'biodiversity_record', entityId: id, organizationId: orgId, actorId: userId });
    return record;
  },
  async delete(orgId: string, id: string, userId?: string) {
    const existing = await biodiversityRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Biodiversity record not found');
    await biodiversityRepo.softDelete(id, orgId);
    await audit({ action: 'biodiversity.delete', entity: 'biodiversity_record', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  async getKpis(orgId: string) {
    const records = await biodiversityRepo.listByOrganization(orgId);
    const totalTreesPlanted = records.reduce((s, r) => s + r.treesPlanted, 0);
    const totalTreesLost = records.reduce((s, r) => s + r.treesLost, 0);
    const totalArea = records.reduce((s, r) => s + (r.areaSize || 0), 0);
    const activeProjects = records.filter(r => r.status === 'active').length;
    const speciesCount = new Set(records.flatMap(r => r.speciesList || [])).size;
    return {
      totalTreesPlanted,
      totalTreesLost,
      netTrees: totalTreesPlanted - totalTreesLost,
      totalArea: parseFloat(totalArea.toFixed(2)),
      activeProjects,
      speciesCount,
      totalRecords: records.length,
    };
  },
};
