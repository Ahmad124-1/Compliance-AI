import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { airEmissionRepo } from '../repositories/air-emission.repo.js';
import { airEmissionLimitRepo } from '../repositories/air-emission-limit.repo.js';

export const airService = {
  // Air Emissions CRUD
  async listEmissions(orgId: string, filter: Record<string, unknown> = {}) {
    return airEmissionRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      emissionSourceId: filter.emissionSourceId as string | undefined,
      emissionType: filter.emissionType as any,
      reportingPeriod: filter.reportingPeriod as string | undefined,
      startDate: filter.startDate as string | undefined,
      endDate: filter.endDate as string | undefined,
    });
  },
  async getEmission(orgId: string, id: string) {
    const emission = await airEmissionRepo.findById(id, orgId);
    if (!emission) throw new NotFoundError('Air emission record not found');
    return emission;
  },
  async createEmission(orgId: string, input: Record<string, unknown>, userId?: string) {
    const emission = await airEmissionRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      emissionSourceId: input.emissionSourceId as string | undefined,
      emissionType: input.emissionType as any,
      quantity: input.quantity as number,
      unit: input.unit as string | undefined,
      monitoringFrequency: input.monitoringFrequency as string | undefined,
      emissionLimit: input.emissionLimit as number | undefined,
      concentration: input.concentration as number | undefined,
      emissionDate: input.emissionDate as string,
      reportingPeriod: input.reportingPeriod as string,
      recordedBy: userId,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'air.emission.create', entity: 'air_emission', entityId: emission.id, organizationId: orgId, actorId: userId });
    return emission;
  },
  async updateEmission(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['emissionType','quantity','unit','monitoringFrequency','emissionLimit','concentration','emissionDate','reportingPeriod','isVerified','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const emission = await airEmissionRepo.update(id, orgId, patch as any);
    if (!emission) throw new NotFoundError('Air emission record not found');
    await audit({ action: 'air.emission.update', entity: 'air_emission', entityId: id, organizationId: orgId, actorId: userId });
    return emission;
  },
  async deleteEmission(orgId: string, id: string, userId?: string) {
    const existing = await airEmissionRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Air emission record not found');
    await airEmissionRepo.softDelete(id, orgId);
    await audit({ action: 'air.emission.delete', entity: 'air_emission', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Emission Limits
  async listLimits(orgId: string, filter: Record<string, unknown> = {}) {
    return airEmissionLimitRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      permitId: filter.permitId as string | undefined,
      emissionType: filter.emissionType as string | undefined,
      isActive: filter.isActive as boolean | undefined,
    });
  },
  async getLimit(orgId: string, id: string) {
    const limit = await airEmissionLimitRepo.findById(id, orgId);
    if (!limit) throw new NotFoundError('Emission limit not found');
    return limit;
  },
  async createLimit(orgId: string, input: Record<string, unknown>, userId?: string) {
    const limit = await airEmissionLimitRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      permitId: input.permitId as string | undefined,
      emissionType: input.emissionType as string,
      limitValue: input.limitValue as number,
      limitUnit: input.limitUnit as string | undefined,
      monitoringFrequency: input.monitoringFrequency as string | undefined,
      maxConcentration: input.maxConcentration as number | undefined,
      concentrationUnit: input.concentrationUnit as string | undefined,
      effectiveDate: input.effectiveDate as string,
      expiryDate: input.expiryDate as string | undefined,
      isActive: input.isActive as boolean | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'air.limit.create', entity: 'air_emission_limit', entityId: limit.id, organizationId: orgId, actorId: userId });
    return limit;
  },
  async updateLimit(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['emissionType','limitValue','limitUnit','monitoringFrequency','maxConcentration','concentrationUnit','effectiveDate','expiryDate','isActive','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const limit = await airEmissionLimitRepo.update(id, orgId, patch as any);
    if (!limit) throw new NotFoundError('Emission limit not found');
    await audit({ action: 'air.limit.update', entity: 'air_emission_limit', entityId: id, organizationId: orgId, actorId: userId });
    return limit;
  },
  async deleteLimit(orgId: string, id: string, userId?: string) {
    const existing = await airEmissionLimitRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Emission limit not found');
    await airEmissionLimitRepo.softDelete(id, orgId);
    await audit({ action: 'air.limit.delete', entity: 'air_emission_limit', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Air KPIs
  async getKpis(orgId: string, filter: { facilityId?: string; startDate?: string; endDate?: string } = {}) {
    const records = await airEmissionRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
    const totalEmissions = records.reduce((s, r) => s + r.quantity, 0);
    const typeBreakdown: Record<string, number> = {};
    for (const r of records) {
      typeBreakdown[r.emissionType] = (typeBreakdown[r.emissionType] || 0) + r.quantity;
    }
    return {
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      recordCount: records.length,
      typeBreakdown: Object.entries(typeBreakdown).map(([emissionType, quantity]) => ({ emissionType, quantity: parseFloat(quantity.toFixed(2)) })),
    };
  },
};
