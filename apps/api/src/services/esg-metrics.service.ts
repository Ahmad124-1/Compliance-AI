import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgMetricRepo } from '../repositories/esg-metric.repo.js';

export const esgMetricService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const page = (filter.page as number) ?? 1;
    const limit = (filter.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const metrics = await esgMetricRepo.listByOrganization(orgId, {
      search: filter.search as string | undefined,
      frameworkId: filter.frameworkId as string | undefined,
      pillar: filter.pillar as string | undefined,
      category: filter.category as string | undefined,
      reportingFrequency: filter.reportingFrequency as string | undefined,
      isMandatory: filter.isMandatory !== undefined ? (filter.isMandatory as boolean) : undefined,
    });
    const total = metrics.length;
    const paginated = metrics.slice(offset, offset + limit);
    return { metrics: paginated, total, page, limit };
  },

  async get(orgId: string, id: string) {
    const metric = await esgMetricRepo.findById(id, orgId);
    if (!metric) throw new NotFoundError('ESG metric not found');
    return metric;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const metric = await esgMetricRepo.create({
      organizationId: orgId,
      frameworkId: input.frameworkId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      metricCode: input.metricCode as string,
      category: input.category as string,
      pillar: input.pillar as string,
      unit: input.unit as string | undefined,
      dataType: input.dataType as string,
      reportingFrequency: input.reportingFrequency as string,
      applicableFacilities: (input.applicableFacilities as string[]) ?? [],
      applicableDepartments: (input.applicableDepartments as string[]) ?? [],
      calculationMethod: input.calculationMethod as string | undefined,
      thresholdWarning: input.thresholdWarning as number | undefined,
      thresholdCritical: input.thresholdCritical as number | undefined,
      targetValue: input.targetValue as number | undefined,
      baselineValue: input.baselineValue as number | undefined,
      evidenceRequired: (input.evidenceRequired as boolean) ?? false,
      verificationRequired: (input.verificationRequired as boolean) ?? false,
      isMandatory: (input.isMandatory as boolean) ?? true,
    });
    await audit({ action: 'esg.metric.create', entity: 'esg_metric', entityId: metric.id });
    return metric;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.thresholdWarning !== undefined) patch.thresholdWarning = input.thresholdWarning;
    if (input.thresholdCritical !== undefined) patch.thresholdCritical = input.thresholdCritical;
    if (input.targetValue !== undefined) patch.targetValue = input.targetValue;
    if (input.baselineValue !== undefined) patch.baselineValue = input.baselineValue;
    if (input.evidenceRequired !== undefined) patch.evidenceRequired = input.evidenceRequired;
    if (input.verificationRequired !== undefined) patch.verificationRequired = input.verificationRequired;
    if (input.isMandatory !== undefined) patch.isMandatory = input.isMandatory;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const metric = await esgMetricRepo.update(id, orgId, patch);
    if (!metric) throw new NotFoundError('ESG metric not found');
    await audit({ action: 'esg.metric.update', entity: 'esg_metric', entityId: id });
    return metric;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgMetricRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG metric not found');
    await esgMetricRepo.softDelete(id, orgId);
    await audit({ action: 'esg.metric.delete', entity: 'esg_metric', entityId: id });
    return { success: true };
  },

  async listByFramework(frameworkId: string, orgId: string) {
    return esgMetricRepo.listByFramework(frameworkId, orgId);
  },
};
