import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { waterUsageRepo } from '../repositories/water-usage.repo.js';
import { waterTargetRepo } from '../repositories/water-target.repo.js';

export const waterService = {
  // Water Usage CRUD
  async listUsage(orgId: string, filter: Record<string, unknown> = {}) {
    return waterUsageRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      siteId: filter.siteId as string | undefined,
      sourceType: filter.sourceType as any,
      startDate: filter.startDate as string | undefined,
      endDate: filter.endDate as string | undefined,
    });
  },
  async getUsage(orgId: string, id: string) {
    const usage = await waterUsageRepo.findById(id, orgId);
    if (!usage) throw new NotFoundError('Water usage record not found');
    return usage;
  },
  async createUsage(orgId: string, input: Record<string, unknown>, userId?: string) {
    const usage = await waterUsageRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      sourceType: input.sourceType as any,
      consumptionDate: input.consumptionDate as string,
      consumptionAmount: input.consumptionAmount as number,
      unit: input.unit as string | undefined,
      dischargeAmount: input.dischargeAmount as number | undefined,
      dischargeQuality: input.dischargeQuality as string | undefined,
      treatmentMethod: input.treatmentMethod as string | undefined,
      reuseAmount: input.reuseAmount as number | undefined,
      leakDetected: input.leakDetected as boolean | undefined,
      leakDetails: input.leakDetails as string | undefined,
      waterIntensity: input.waterIntensity as number | undefined,
      cost: input.cost as number | undefined,
      recordedBy: userId,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'water.usage.create', entity: 'water_usage', entityId: usage.id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async updateUsage(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['sourceType','consumptionDate','consumptionAmount','unit','dischargeAmount','dischargeQuality','treatmentMethod','reuseAmount','leakDetected','leakDetails','waterIntensity','cost','isVerified','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const usage = await waterUsageRepo.update(id, orgId, patch as any);
    if (!usage) throw new NotFoundError('Water usage record not found');
    await audit({ action: 'water.usage.update', entity: 'water_usage', entityId: id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async deleteUsage(orgId: string, id: string, userId?: string) {
    const existing = await waterUsageRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Water usage record not found');
    await waterUsageRepo.softDelete(id, orgId);
    await audit({ action: 'water.usage.delete', entity: 'water_usage', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Water Targets
  async listTargets(orgId: string, filter: Record<string, unknown> = {}) {
    return waterTargetRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      departmentId: filter.departmentId as string | undefined,
      targetType: filter.targetType as string | undefined,
      status: filter.status as string | undefined,
    });
  },
  async getTarget(orgId: string, id: string) {
    const target = await waterTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('Water target not found');
    return target;
  },
  async createTarget(orgId: string, input: Record<string, unknown>, userId?: string) {
    const target = await waterTargetRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      targetType: input.targetType as string,
      baselineValue: input.baselineValue as number,
      targetValue: input.targetValue as number,
      currentValue: input.currentValue as number | undefined,
      unit: input.unit as string | undefined,
      baselineYear: input.baselineYear as number,
      targetYear: input.targetYear as number,
      progressPct: input.progressPct as number | undefined,
      status: input.status as string | undefined,
      ownerId: input.ownerId as string | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'water.target.create', entity: 'water_target', entityId: target.id, organizationId: orgId, actorId: userId });
    return target;
  },
  async updateTarget(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','targetType','baselineValue','targetValue','currentValue','unit','baselineYear','targetYear','progressPct','status','ownerId','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const target = await waterTargetRepo.update(id, orgId, patch as any);
    if (!target) throw new NotFoundError('Water target not found');
    await audit({ action: 'water.target.update', entity: 'water_target', entityId: id, organizationId: orgId, actorId: userId });
    return target;
  },
  async deleteTarget(orgId: string, id: string, userId?: string) {
    const existing = await waterTargetRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Water target not found');
    await waterTargetRepo.softDelete(id, orgId);
    await audit({ action: 'water.target.delete', entity: 'water_target', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Water KPIs
  async getKpis(orgId: string, filter: { facilityId?: string; startDate?: string; endDate?: string } = {}) {
    const records = await waterUsageRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
    const totalConsumption = records.reduce((s, r) => s + r.consumptionAmount, 0);
    const totalDischarge = records.reduce((s, r) => s + (r.dischargeAmount || 0), 0);
    const totalReuse = records.reduce((s, r) => s + r.reuseAmount, 0);
    const leaks = records.filter(r => r.leakDetected).length;
    return {
      totalConsumption: parseFloat(totalConsumption.toFixed(2)),
      totalDischarge: parseFloat(totalDischarge.toFixed(2)),
      totalReuse: parseFloat(totalReuse.toFixed(2)),
      reuseRate: totalConsumption > 0 ? parseFloat(((totalReuse / totalConsumption) * 100).toFixed(2)) : 0,
      leakCount: leaks,
      recordCount: records.length,
      averageConsumption: records.length > 0 ? parseFloat((totalConsumption / records.length).toFixed(2)) : 0,
    };
  },
};
