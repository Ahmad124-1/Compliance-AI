import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgDataPointRepo } from '../repositories/esg-data-point.repo.js';

export const esgDataService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const dataPoints = await esgDataPointRepo.listByOrganization(orgId, {
      metricId: filter.metricId as string | undefined,
      periodId: filter.periodId as string | undefined,
      facilityId: filter.facilityId as string | undefined,
      departmentId: filter.departmentId as string | undefined,
      isVerified: filter.isVerified !== undefined ? (filter.isVerified as boolean) : undefined,
    });
    return { dataPoints, total: dataPoints.length };
  },

  async get(orgId: string, id: string) {
    const dataPoint = await esgDataPointRepo.findById(id, orgId);
    if (!dataPoint) throw new NotFoundError('ESG data point not found');
    return dataPoint;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const dataPoint = await esgDataPointRepo.create({
      organizationId: orgId,
      metricId: input.metricId as string,
      periodId: input.periodId as string,
      facilityId: input.facilityId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      value: input.value as number,
      valueText: input.valueText as string | undefined,
      valueJson: (input.valueJson as Record<string, unknown>) ?? {},
      unit: input.unit as string | undefined,
      confidenceScore: input.confidenceScore as number | undefined,
      sourceSystem: input.sourceSystem as string | undefined,
      sourceReference: input.sourceReference as string | undefined,
      notes: input.notes as string | undefined,
      recordedBy: input.recordedBy as string | undefined,
    });
    await audit({ action: 'esg.data_point.create', entity: 'esg_data_point', entityId: dataPoint.id });
    return dataPoint;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.value !== undefined) patch.value = input.value;
    if (input.valueText !== undefined) patch.valueText = input.valueText;
    if (input.valueJson !== undefined) patch.valueJson = input.valueJson;
    if (input.confidenceScore !== undefined) patch.confidenceScore = input.confidenceScore;
    if (input.notes !== undefined) patch.notes = input.notes;
    const dataPoint = await esgDataPointRepo.update(id, orgId, patch);
    if (!dataPoint) throw new NotFoundError('ESG data point not found');
    await audit({ action: 'esg.data_point.update', entity: 'esg_data_point', entityId: id });
    return dataPoint;
  },

  async verify(orgId: string, id: string, verifiedBy: string) {
    const dataPoint = await esgDataPointRepo.verify(id, orgId, verifiedBy);
    if (!dataPoint) throw new NotFoundError('ESG data point not found');
    await audit({ action: 'esg.data_point.verify', entity: 'esg_data_point', entityId: id });
    return dataPoint;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgDataPointRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG data point not found');
    await esgDataPointRepo.softDelete(id, orgId);
    await audit({ action: 'esg.data_point.delete', entity: 'esg_data_point', entityId: id });
    return { success: true };
  },
};
