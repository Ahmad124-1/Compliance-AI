import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { environmentalReportRepo } from '../repositories/environmental-report.repo.js';
import { waterUsageRepo } from '../repositories/water-usage.repo.js';
import { wasteRecordRepo } from '../repositories/waste-record.repo.js';
import { airEmissionRepo } from '../repositories/air-emission.repo.js';
import { chemicalRepo } from '../repositories/chemical.repo.js';
import { environmentalIncidentRepo } from '../repositories/environmental-incident.repo.js';
import { permitRepo } from '../repositories/permit.repo.js';
import { biodiversityRepo } from '../repositories/biodiversity.repo.js';

export const environmentalReportsService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalReportRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      reportType: filter.reportType as string | undefined,
      status: filter.status as string | undefined,
      format: filter.format as string | undefined,
    });
  },
  async get(orgId: string, id: string) {
    const report = await environmentalReportRepo.findById(id, orgId);
    if (!report) throw new NotFoundError('Environmental report not found');
    return report;
  },
  async create(orgId: string, input: Record<string, unknown>, userId?: string) {
    const report = await environmentalReportRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      reportType: input.reportType as string,
      format: input.format as string | undefined,
      status: input.status as string | undefined,
      fileUrl: input.fileUrl as string | undefined,
      summary: input.summary as string | undefined,
      chartData: input.chartData as Record<string, unknown> | undefined,
      params: input.params as Record<string, unknown> | undefined,
      generatedBy: userId,
      generatedAt: input.generatedAt as string | undefined,
      schedule: input.schedule as string | undefined,
    });
    await audit({ action: 'report.create', entity: 'environmental_report', entityId: report.id, organizationId: orgId, actorId: userId });
    return report;
  },
  async update(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','reportType','format','status','fileUrl','summary','chartData','params','schedule'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const report = await environmentalReportRepo.update(id, orgId, patch as any);
    if (!report) throw new NotFoundError('Environmental report not found');
    await audit({ action: 'report.update', entity: 'environmental_report', entityId: id, organizationId: orgId, actorId: userId });
    return report;
  },
  async delete(orgId: string, id: string, userId?: string) {
    const existing = await environmentalReportRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental report not found');
    await environmentalReportRepo.softDelete(id, orgId);
    await audit({ action: 'report.delete', entity: 'environmental_report', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  async generateEnvironmentalReport(orgId: string, params: { facilityId?: string; startDate?: string; endDate?: string }) {
    const water = await waterUsageRepo.listByOrganization(orgId, { facilityId: params.facilityId, startDate: params.startDate, endDate: params.endDate });
    const waste = await wasteRecordRepo.listByOrganization(orgId, { facilityId: params.facilityId, startDate: params.startDate, endDate: params.endDate });
    const air = await airEmissionRepo.listByOrganization(orgId, { facilityId: params.facilityId, startDate: params.startDate, endDate: params.endDate });
    const chemicals = await chemicalRepo.listByOrganization(orgId, { facilityId: params.facilityId });
    const incidents = await environmentalIncidentRepo.listByOrganization(orgId, { facilityId: params.facilityId, startDate: params.startDate, endDate: params.endDate });
    const permits = await permitRepo.listByOrganization(orgId, { facilityId: params.facilityId });
    const biodiversity = await biodiversityRepo.listByOrganization(orgId, { facilityId: params.facilityId });

    const totalWater = water.reduce((s, r) => s + r.consumptionAmount, 0);
    const totalWaste = waste.reduce((s, r) => s + r.quantity, 0);
    const totalAir = air.reduce((s, r) => s + r.quantity, 0);
    const totalChemicals = chemicals.length;
    const openIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;
    const activePermits = permits.filter(p => p.status === 'active').length;
    const totalTrees = biodiversity.reduce((s, r) => s + r.treesPlanted, 0);

    const summary = {
      reportType: 'environmental',
      generatedAt: new Date().toISOString(),
      metrics: {
        totalWaterConsumption: parseFloat(totalWater.toFixed(2)),
        totalWasteGenerated: parseFloat(totalWaste.toFixed(2)),
        totalAirEmissions: parseFloat(totalAir.toFixed(2)),
        totalChemicals,
        openIncidents,
        activePermits,
        totalTreesPlanted: totalTrees,
      },
      waterRecords: water.length,
      wasteRecords: waste.length,
      airRecords: air.length,
      incidentCount: incidents.length,
      permitCount: permits.length,
      biodiversityCount: biodiversity.length,
    };

    return summary;
  },
};
