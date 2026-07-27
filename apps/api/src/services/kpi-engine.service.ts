import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityKpiRepo } from '../repositories/sustainability-kpi.repo.js';
import { kpiMeasurementRepo } from '../repositories/kpi-measurement.repo.js';

export const kpiEngineService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const page = (filter.page as number) ?? 1;
    const limit = (filter.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId, {
      search: filter.search as string,
      kpiType: filter.kpiType as string,
      frequency: filter.frequency as string,
      programId: filter.programId as string,
      goalId: filter.goalId as string,
      initiativeId: filter.initiativeId as string,
      departmentId: filter.departmentId as string,
    });
    const total = kpis.length;
    const paginated = kpis.slice(offset, offset + limit);
    const measurements = await Promise.all(
      paginated.map(async (kpi) => {
        const latest = await kpiMeasurementRepo.getLatest(kpi.id, orgId);
        return { ...kpi, latestValue: latest?.value ?? null, latestRecordedAt: latest?.recordedAt ?? null };
      }),
    );
    return { kpis: paginated, measurements, total, page, limit };
  },

  async get(orgId: string, id: string) {
    const kpi = await sustainabilityKpiRepo.findById(id, orgId);
    if (!kpi) throw new NotFoundError('KPI not found');
    const latest = await kpiMeasurementRepo.getLatest(id, orgId);
    const trend = await kpiMeasurementRepo.getTrend(id, orgId, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString());
    return { ...kpi, latestMeasurement: latest, trend };
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const kpi = await sustainabilityKpiRepo.create({
      organizationId: orgId,
      programId: input.programId as string | undefined,
      goalId: input.goalId as string | undefined,
      initiativeId: input.initiativeId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      kpiType: input.kpiType as string,
      frequency: (input.frequency as string) ?? 'monthly',
      unit: (input.unit as string) ?? '',
      targetValue: input.targetValue as number | undefined,
      baselineValue: input.baselineValue as number | undefined,
      thresholdWarning: input.thresholdWarning as number | undefined,
      thresholdCritical: input.thresholdCritical as number | undefined,
      aggregation: (input.aggregation as string) ?? 'latest',
      departmentId: input.departmentId as string | undefined,
      facilityId: input.facilityId as string | undefined,
      ownerId: input.ownerId as string | undefined,
    });
    await audit({ action: 'sustainability.kpi.create', entity: 'sustainability_kpi', entityId: kpi.id });
    return kpi;
  },

  async recordMeasurement(orgId: string, kpiId: string, input: Record<string, unknown>) {
    const kpi = await sustainabilityKpiRepo.findById(kpiId, orgId);
    if (!kpi) throw new NotFoundError('KPI not found');
    const measurement = await kpiMeasurementRepo.create({
      organizationId: orgId,
      kpiId,
      value: input.value as number,
      recordedBy: input.recordedBy as string | undefined,
      source: input.source as string | undefined,
      notes: input.notes as string | undefined,
      departmentId: input.departmentId as string | undefined,
      facilityId: input.facilityId as string | undefined,
    });
    if (kpi.baselineValue === null) {
      await sustainabilityKpiRepo.update(kpiId, orgId, { baselineValue: input.value as number });
    }
    return measurement;
  },

  async getMeasurements(orgId: string, kpiId: string, limit?: number, offset?: number) {
    return kpiMeasurementRepo.listByKpi(kpiId, orgId, limit, offset);
  },

  async getTrend(orgId: string, kpiId: string, fromDate: string, toDate: string) {
    return kpiMeasurementRepo.getTrend(kpiId, orgId, fromDate, toDate);
  },

  async getAggregated(orgId: string, kpiId: string, frequency: string, dateFrom?: string, dateTo?: string) {
    return kpiMeasurementRepo.getAggregated(kpiId, orgId, frequency, dateFrom, dateTo);
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'kpiType', 'frequency', 'unit', 'targetValue', 'baselineValue', 'thresholdWarning', 'thresholdCritical', 'aggregation', 'departmentId', 'facilityId', 'ownerId']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const kpi = await sustainabilityKpiRepo.update(id, orgId, patch);
    if (!kpi) throw new NotFoundError('KPI not found');
    await audit({ action: 'sustainability.kpi.update', entity: 'sustainability_kpi', entityId: id });
    return kpi;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityKpiRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('KPI not found');
    await sustainabilityKpiRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.kpi.delete', entity: 'sustainability_kpi', entityId: id });
    return { success: true };
  },

  getThresholdStatus(kpi: { thresholdWarning?: number | null; thresholdCritical?: number | null; latestValue?: number | null }): 'normal' | 'warning' | 'critical' | 'no_threshold' {
    if (kpi.latestValue === null || kpi.latestValue === undefined) return 'no_threshold';
    if (kpi.thresholdCritical !== null && kpi.thresholdCritical !== undefined && kpi.latestValue >= kpi.thresholdCritical) return 'critical';
    if (kpi.thresholdWarning !== null && kpi.thresholdWarning !== undefined && kpi.latestValue >= kpi.thresholdWarning) return 'warning';
    return 'normal';
  },
};
