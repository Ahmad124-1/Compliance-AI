import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import type {
  AirEmissionType,
  ApprovalStatus,
  EnvironmentalDashboard,
  EnvironmentalProjectType,
  HazardClassification,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  InvestigationStatus,
  LikelihoodLevel,
  PermitStatus,
  PermitType,
  ProjectStatus,
  ResourceType,
  ReviewSchedule,
  RiskRating,
  RiskStatus,
  SeverityLevel,
  WasteType,
  WaterSourceType,
} from '../types/environment.js';
import { waterUsageRepo } from '../repositories/water-usage.repo.js';
import { wasteRecordRepo } from '../repositories/waste-record.repo.js';
import { airEmissionRepo } from '../repositories/air-emission.repo.js';
import { chemicalRepo } from '../repositories/chemical.repo.js';
import { environmentalIncidentRepo } from '../repositories/environmental-incident.repo.js';
import { environmentalRiskRepo } from '../repositories/environmental-risk.repo.js';
import { permitRepo } from '../repositories/permit.repo.js';
import { resourceUsageRepo } from '../repositories/resource-usage.repo.js';
import { environmentalProjectRepo } from '../repositories/environmental-project.repo.js';

export const environmentService = {
  async getDashboard(orgId: string): Promise<EnvironmentalDashboard> {
    const water = await waterUsageRepo.listByOrganization(orgId);
    const waste = await wasteRecordRepo.listByOrganization(orgId);
    const air = await airEmissionRepo.listByOrganization(orgId);
    const chemicals = await chemicalRepo.listByOrganization(orgId);
    const incidents = await environmentalIncidentRepo.listByOrganization(orgId);
    const risks = await environmentalRiskRepo.listByOrganization(orgId);
    const permits = await permitRepo.listByOrganization(orgId);
    const resources = await resourceUsageRepo.listByOrganization(orgId);
    const projects = await environmentalProjectRepo.listByOrganization(orgId);

    const totalWaterUsage = water.reduce((sum, w) => sum + w.consumptionAmount, 0);
    const totalWasteGenerated = waste.reduce((sum, w) => sum + w.quantity, 0);
    const totalWasteRecycled = waste.filter(w => w.wasteType !== 'hazardous' && w.wasteType !== 'general').reduce((sum, w) => sum + w.quantity, 0);
    const hazardousWaste = waste.filter(w => w.wasteType === 'hazardous').reduce((sum, w) => sum + w.quantity, 0);
    const totalAirEmissions = air.reduce((sum, a) => sum + a.quantity, 0);
    const activeIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;
    const totalPermits = permits.length;
    const activePermits = permits.filter(p => p.status === 'active').length;
    const expiringPermits = permits.filter(p => p.status === 'active' && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;
    const totalRisks = risks.length;
    const highRisks = risks.filter(r => r.riskScore >= 15).length;
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'approved').length;
    const totalChemicals = chemicals.length;

    const complianceScore = totalPermits > 0 ? Math.round((activePermits / totalPermits) * 100) : 100;

    const monthlyWaterMap = new Map<string, number>();
    for (const w of water) {
      const month = w.consumptionDate.slice(0, 7);
      monthlyWaterMap.set(month, (monthlyWaterMap.get(month) || 0) + w.consumptionAmount);
    }
    const monthlyWaterTrend = Array.from(monthlyWaterMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, usage]) => ({ month, usage: parseFloat(usage.toFixed(2)) }));

    const monthlyWasteMap = new Map<string, { generated: number; recycled: number }>();
    for (const w of waste) {
      const month = w.wasteDate.slice(0, 7);
      const cur = monthlyWasteMap.get(month) || { generated: 0, recycled: 0 };
      cur.generated += w.quantity;
      if (w.wasteType !== 'hazardous' && w.wasteType !== 'general') cur.recycled += w.quantity;
      monthlyWasteMap.set(month, cur);
    }
    const monthlyWasteTrend = Array.from(monthlyWasteMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, generated: parseFloat(v.generated.toFixed(2)), recycled: parseFloat(v.recycled.toFixed(2)) }));

    const monthlyAirMap = new Map<string, number>();
    for (const a of air) {
      const month = a.emissionDate.slice(0, 7);
      monthlyAirMap.set(month, (monthlyAirMap.get(month) || 0) + a.quantity);
    }
    const monthlyAirTrend = Array.from(monthlyAirMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, emissions]) => ({ month, emissions: parseFloat(emissions.toFixed(2)) }));

    const incidentMonthMap = new Map<string, number>();
    for (const inc of incidents) {
      const month = inc.incidentDate.slice(0, 7);
      incidentMonthMap.set(month, (incidentMonthMap.get(month) || 0) + 1);
    }
    const incidentTrend = Array.from(incidentMonthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }));

    const permitStatusDist = new Map<string, number>();
    for (const p of permits) permitStatusDist.set(p.status, (permitStatusDist.get(p.status) || 0) + 1);
    const permitStatusDistribution = Array.from(permitStatusDist.entries()).map(([status, count]) => ({ status, count }));

    const riskLevels = ['low', 'medium', 'high', 'extreme'];
    const riskScoreDistribution = riskLevels.map(level => ({
      level,
      count: risks.filter(r => {
        if (level === 'low') return r.riskScore < 5;
        if (level === 'medium') return r.riskScore >= 5 && r.riskScore < 15;
        if (level === 'high') return r.riskScore >= 15 && r.riskScore < 25;
        return r.riskScore >= 25;
      }).length,
    }));

    const resourceEfficiency = resources.length > 0 ? parseFloat((resources.filter(r => r.efficiencyRating !== null).reduce((sum, r) => sum + (r.efficiencyRating || 0), 0) / Math.max(resources.filter(r => r.efficiencyRating !== null).length, 1)).toFixed(2)) : 0;

    return {
      totalWaterUsage: parseFloat(totalWaterUsage.toFixed(2)),
      totalWasteGenerated: parseFloat(totalWasteGenerated.toFixed(2)),
      totalWasteRecycled: parseFloat(totalWasteRecycled.toFixed(2)),
      hazardousWaste: parseFloat(hazardousWaste.toFixed(2)),
      totalAirEmissions: parseFloat(totalAirEmissions.toFixed(2)),
      totalChemicals,
      activeIncidents,
      complianceScore,
      totalPermits,
      activePermits,
      expiringPermits,
      totalRisks,
      highRisks,
      totalProjects,
      activeProjects,
      resourceEfficiency,
      monthlyWaterTrend,
      monthlyWasteTrend,
      monthlyAirTrend,
      incidentTrend,
      permitStatusDistribution,
      riskScoreDistribution,
      facilityComparison: [],
      topWasteTypes: [],
      topChemicals: [],
    };
  },

  // Water Usage
  async listWaterUsage(orgId: string, filter: Record<string, unknown> = {}) {
    return waterUsageRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, sourceType: filter.sourceType as WaterSourceType | undefined, startDate: filter.startDate as string | undefined, endDate: filter.endDate as string | undefined });
  },
  async getWaterUsage(orgId: string, id: string) {
    const usage = await waterUsageRepo.findById(id, orgId);
    if (!usage) throw new NotFoundError('Water usage record not found');
    return usage;
  },
  async createWaterUsage(orgId: string, input: Record<string, unknown>, userId?: string) {
    const usage = await waterUsageRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, departmentId: input.departmentId as string | undefined, sourceType: input.sourceType as WaterSourceType, consumptionDate: input.consumptionDate as string, consumptionAmount: input.consumptionAmount as number, unit: input.unit as string | undefined, dischargeAmount: input.dischargeAmount as number | undefined, dischargeQuality: input.dischargeQuality as string | undefined, treatmentMethod: input.treatmentMethod as string | undefined, reuseAmount: input.reuseAmount as number | undefined, leakDetected: input.leakDetected as boolean | undefined, leakDetails: input.leakDetails as string | undefined, waterIntensity: input.waterIntensity as number | undefined, cost: input.cost as number | undefined, recordedBy: userId, notes: input.notes as string | undefined });
    await audit({ action: 'environment.water.create', entity: 'water_usage', entityId: usage.id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async updateWaterUsage(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['sourceType','consumptionDate','consumptionAmount','unit','dischargeAmount','dischargeQuality','treatmentMethod','reuseAmount','leakDetected','leakDetails','waterIntensity','cost','isVerified','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const usage = await waterUsageRepo.update(id, orgId, patch as any);
    if (!usage) throw new NotFoundError('Water usage record not found');
    await audit({ action: 'environment.water.update', entity: 'water_usage', entityId: id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async deleteWaterUsage(orgId: string, id: string, userId?: string) {
    const existing = await waterUsageRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Water usage record not found');
    await waterUsageRepo.softDelete(id, orgId);
    await audit({ action: 'environment.water.delete', entity: 'water_usage', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Waste Records
  async listWasteRecords(orgId: string, filter: Record<string, unknown> = {}) {
    return wasteRecordRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, wasteType: filter.wasteType as WasteType | undefined, startDate: filter.startDate as string | undefined, endDate: filter.endDate as string | undefined });
  },
  async getWasteRecord(orgId: string, id: string) {
    const record = await wasteRecordRepo.findById(id, orgId);
    if (!record) throw new NotFoundError('Waste record not found');
    return record;
  },
  async createWasteRecord(orgId: string, input: Record<string, unknown>, userId?: string) {
    const record = await wasteRecordRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, departmentId: input.departmentId as string | undefined, wasteType: input.wasteType as WasteType, quantity: input.quantity as number, unit: input.unit as string | undefined, weight: input.weight as number | undefined, disposalMethod: input.disposalMethod as string, recyclerId: input.recyclerId as string | undefined, vendorId: input.vendorId as string | undefined, manifestNumber: input.manifestNumber as string | undefined, certificateUrl: input.certificateUrl as string | undefined, hazardousDetails: input.hazardousDetails as string | undefined, wasteDate: input.wasteDate as string, cost: input.cost as number | undefined, recordedBy: userId, notes: input.notes as string | undefined });
    await audit({ action: 'environment.waste.create', entity: 'waste_record', entityId: record.id, organizationId: orgId, actorId: userId });
    return record;
  },
  async updateWasteRecord(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['wasteType','quantity','unit','weight','disposalMethod','recyclerId','vendorId','manifestNumber','certificateUrl','hazardousDetails','wasteDate','cost','isVerified','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const record = await wasteRecordRepo.update(id, orgId, patch as any);
    if (!record) throw new NotFoundError('Waste record not found');
    await audit({ action: 'environment.waste.update', entity: 'waste_record', entityId: id, organizationId: orgId, actorId: userId });
    return record;
  },
  async deleteWasteRecord(orgId: string, id: string, userId?: string) {
    const existing = await wasteRecordRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Waste record not found');
    await wasteRecordRepo.softDelete(id, orgId);
    await audit({ action: 'environment.waste.delete', entity: 'waste_record', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Air Emissions
  async listAirEmissions(orgId: string, filter: Record<string, unknown> = {}) {
    return airEmissionRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, emissionSourceId: filter.emissionSourceId as string | undefined, emissionType: filter.emissionType as AirEmissionType | undefined, reportingPeriod: filter.reportingPeriod as string | undefined, startDate: filter.startDate as string | undefined, endDate: filter.endDate as string | undefined });
  },
  async getAirEmission(orgId: string, id: string) {
    const emission = await airEmissionRepo.findById(id, orgId);
    if (!emission) throw new NotFoundError('Air emission record not found');
    return emission;
  },
  async createAirEmission(orgId: string, input: Record<string, unknown>, userId?: string) {
    const emission = await airEmissionRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, emissionSourceId: input.emissionSourceId as string | undefined, emissionType: input.emissionType as AirEmissionType, quantity: input.quantity as number, unit: input.unit as string | undefined, monitoringFrequency: input.monitoringFrequency as string | undefined, emissionLimit: input.emissionLimit as number | undefined, concentration: input.concentration as number | undefined, emissionDate: input.emissionDate as string, reportingPeriod: input.reportingPeriod as string, recordedBy: userId, notes: input.notes as string | undefined });
    await audit({ action: 'environment.air.create', entity: 'air_emission', entityId: emission.id, organizationId: orgId, actorId: userId });
    return emission;
  },
  async updateAirEmission(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['emissionType','quantity','unit','monitoringFrequency','emissionLimit','concentration','emissionDate','reportingPeriod','isVerified','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const emission = await airEmissionRepo.update(id, orgId, patch as any);
    if (!emission) throw new NotFoundError('Air emission record not found');
    await audit({ action: 'environment.air.update', entity: 'air_emission', entityId: id, organizationId: orgId, actorId: userId });
    return emission;
  },
  async deleteAirEmission(orgId: string, id: string, userId?: string) {
    const existing = await airEmissionRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Air emission record not found');
    await airEmissionRepo.softDelete(id, orgId);
    await audit({ action: 'environment.air.delete', entity: 'air_emission', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Chemicals
  async listChemicals(orgId: string, filter: Record<string, unknown> = {}) {
    return chemicalRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, hazardClassification: filter.hazardClassification as HazardClassification | undefined, approvalStatus: filter.approvalStatus as ApprovalStatus | undefined, riskRating: filter.riskRating as RiskRating | undefined });
  },
  async getChemical(orgId: string, id: string) {
    const chemical = await chemicalRepo.findById(id, orgId);
    if (!chemical) throw new NotFoundError('Chemical record not found');
    return chemical;
  },
  async createChemical(orgId: string, input: Record<string, unknown>, userId?: string) {
    const chemical = await chemicalRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, chemicalName: input.chemicalName as string, casNumber: input.casNumber as string | undefined, formula: input.formula as string | undefined, hazardClassification: input.hazardClassification as HazardClassification, storageLocation: input.storageLocation as string | undefined, quantity: input.quantity as number, unit: input.unit as string | undefined, supplierId: input.supplierId as string | undefined, expiryDate: input.expiryDate as string | undefined, msdsUrl: input.msdsUrl as string | undefined, usageDescription: input.usageDescription as string | undefined, riskRating: input.riskRating as RiskRating | undefined, emergencyProcedures: input.emergencyProcedures as string | undefined, ppeRequirements: input.ppeRequirements as string | undefined, approvalStatus: input.approvalStatus as ApprovalStatus | undefined, approvedBy: input.approvedBy as string | undefined, approvedAt: input.approvedAt as string | undefined, recordedBy: userId, notes: input.notes as string | undefined });
    await audit({ action: 'environment.chemical.create', entity: 'chemical', entityId: chemical.id, organizationId: orgId, actorId: userId });
    return chemical;
  },
  async updateChemical(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['chemicalName','casNumber','formula','hazardClassification','storageLocation','quantity','unit','supplierId','expiryDate','msdsUrl','usageDescription','riskRating','emergencyProcedures','ppeRequirements','approvalStatus','approvedBy','approvedAt','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const chemical = await chemicalRepo.update(id, orgId, patch as any);
    if (!chemical) throw new NotFoundError('Chemical record not found');
    await audit({ action: 'environment.chemical.update', entity: 'chemical', entityId: id, organizationId: orgId, actorId: userId });
    return chemical;
  },
  async deleteChemical(orgId: string, id: string, userId?: string) {
    const existing = await chemicalRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Chemical record not found');
    await chemicalRepo.softDelete(id, orgId);
    await audit({ action: 'environment.chemical.delete', entity: 'chemical', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Environmental Incidents
  async listIncidents(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalIncidentRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, incidentType: filter.incidentType as IncidentType | undefined, severity: filter.severity as IncidentSeverity | undefined, status: filter.status as IncidentStatus | undefined, startDate: filter.startDate as string | undefined, endDate: filter.endDate as string | undefined });
  },
  async getIncident(orgId: string, id: string) {
    const incident = await environmentalIncidentRepo.findById(id, orgId);
    if (!incident) throw new NotFoundError('Environmental incident not found');
    return incident;
  },
  async createIncident(orgId: string, input: Record<string, unknown>, userId?: string) {
    const incident = await environmentalIncidentRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, incidentType: input.incidentType as IncidentType, title: input.title as string, description: input.description as string | undefined, severity: input.severity as IncidentSeverity | undefined, status: input.status as IncidentStatus | undefined, incidentDate: input.incidentDate as string | undefined, location: input.location as string | undefined, rootCause: input.rootCause as string | undefined, capaId: input.capaId as string | undefined, investigationStatus: input.investigationStatus as InvestigationStatus | undefined, investigationNotes: input.investigationNotes as string | undefined, evidenceUrls: input.evidenceUrls as string[] | undefined, timeline: input.timeline as Record<string, unknown>[] | undefined, responsiblePersonId: input.responsiblePersonId as string | undefined, reportedBy: userId, resolvedBy: input.resolvedBy as string | undefined, resolutionDate: input.resolutionDate as string | undefined, resolutionNotes: input.resolutionNotes as string | undefined });
    await audit({ action: 'environment.incident.create', entity: 'environmental_incident', entityId: incident.id, organizationId: orgId, actorId: userId });
    return incident;
  },
  async updateIncident(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['incidentType','title','description','severity','status','incidentDate','location','rootCause','capaId','investigationStatus','investigationNotes','evidenceUrls','timeline','responsiblePersonId','resolvedBy','resolutionDate','resolutionNotes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const incident = await environmentalIncidentRepo.update(id, orgId, patch as any);
    if (!incident) throw new NotFoundError('Environmental incident not found');
    await audit({ action: 'environment.incident.update', entity: 'environmental_incident', entityId: id, organizationId: orgId, actorId: userId });
    return incident;
  },
  async deleteIncident(orgId: string, id: string, userId?: string) {
    const existing = await environmentalIncidentRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental incident not found');
    await environmentalIncidentRepo.softDelete(id, orgId);
    await audit({ action: 'environment.incident.delete', entity: 'environmental_incident', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Environmental Risks
  async listRisks(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalRiskRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, status: filter.status as RiskStatus | undefined, minScore: filter.minScore as number | undefined, maxScore: filter.maxScore as number | undefined });
  },
  async getRisk(orgId: string, id: string) {
    const risk = await environmentalRiskRepo.findById(id, orgId);
    if (!risk) throw new NotFoundError('Environmental risk not found');
    return risk;
  },
  async createRisk(orgId: string, input: Record<string, unknown>, userId?: string) {
    const risk = await environmentalRiskRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, aspect: input.aspect as string, impact: input.impact as string, likelihood: input.likelihood as LikelihoodLevel, severity: input.severity as SeverityLevel, riskScore: input.riskScore as number, controls: input.controls as string | undefined, mitigationMeasures: input.mitigationMeasures as string | undefined, monitoringPlan: input.monitoringPlan as string | undefined, responsibleOwnerId: input.responsibleOwnerId as string | undefined, reviewSchedule: input.reviewSchedule as ReviewSchedule | undefined, lastReviewDate: input.lastReviewDate as string | undefined, nextReviewDate: input.nextReviewDate as string | undefined, status: input.status as RiskStatus | undefined, notes: input.notes as string | undefined });
    await audit({ action: 'environment.risk.create', entity: 'environmental_risk', entityId: risk.id, organizationId: orgId, actorId: userId });
    return risk;
  },
  async updateRisk(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['aspect','impact','likelihood','severity','riskScore','controls','mitigationMeasures','monitoringPlan','responsibleOwnerId','reviewSchedule','lastReviewDate','nextReviewDate','status','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const risk = await environmentalRiskRepo.update(id, orgId, patch as any);
    if (!risk) throw new NotFoundError('Environmental risk not found');
    await audit({ action: 'environment.risk.update', entity: 'environmental_risk', entityId: id, organizationId: orgId, actorId: userId });
    return risk;
  },
  async deleteRisk(orgId: string, id: string, userId?: string) {
    const existing = await environmentalRiskRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental risk not found');
    await environmentalRiskRepo.softDelete(id, orgId);
    await audit({ action: 'environment.risk.delete', entity: 'environmental_risk', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Permits
  async listPermits(orgId: string, filter: Record<string, unknown> = {}) {
    return permitRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, permitType: filter.permitType as PermitType | undefined, status: filter.status as PermitStatus | undefined, expiringSoon: filter.expiringSoon as boolean | undefined });
  },
  async getPermit(orgId: string, id: string) {
    const permit = await permitRepo.findById(id, orgId);
    if (!permit) throw new NotFoundError('Permit not found');
    return permit;
  },
  async createPermit(orgId: string, input: Record<string, unknown>, userId?: string) {
    const permit = await permitRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, permitType: input.permitType as PermitType, permitNumber: input.permitNumber as string, issuingAuthority: input.issuingAuthority as string, issueDate: input.issueDate as string, expiryDate: input.expiryDate as string, renewalDate: input.renewalDate as string | undefined, status: input.status as PermitStatus | undefined, conditions: input.conditions as string | undefined, supportingDocuments: input.supportingDocuments as string[] | undefined, approvalHistory: input.approvalHistory as Record<string, unknown>[] | undefined, responsiblePersonId: input.responsiblePersonId as string | undefined, notes: input.notes as string | undefined });
    await audit({ action: 'environment.permit.create', entity: 'permit', entityId: permit.id, organizationId: orgId, actorId: userId });
    return permit;
  },
  async updatePermit(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['permitType','permitNumber','issuingAuthority','issueDate','expiryDate','renewalDate','status','conditions','supportingDocuments','approvalHistory','responsiblePersonId','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const permit = await permitRepo.update(id, orgId, patch as any);
    if (!permit) throw new NotFoundError('Permit not found');
    await audit({ action: 'environment.permit.update', entity: 'permit', entityId: id, organizationId: orgId, actorId: userId });
    return permit;
  },
  async deletePermit(orgId: string, id: string, userId?: string) {
    const existing = await permitRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Permit not found');
    await permitRepo.softDelete(id, orgId);
    await audit({ action: 'environment.permit.delete', entity: 'permit', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Resource Usage
  async listResourceUsage(orgId: string, filter: Record<string, unknown> = {}) {
    return resourceUsageRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, siteId: filter.siteId as string | undefined, departmentId: filter.departmentId as string | undefined, resourceType: filter.resourceType as ResourceType | undefined, reportingPeriod: filter.reportingPeriod as string | undefined, startDate: filter.startDate as string | undefined, endDate: filter.endDate as string | undefined });
  },
  async getResourceUsage(orgId: string, id: string) {
    const usage = await resourceUsageRepo.findById(id, orgId);
    if (!usage) throw new NotFoundError('Resource usage record not found');
    return usage;
  },
  async createResourceUsage(orgId: string, input: Record<string, unknown>, userId?: string) {
    const usage = await resourceUsageRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, siteId: input.siteId as string | undefined, departmentId: input.departmentId as string | undefined, resourceType: input.resourceType as ResourceType, consumptionAmount: input.consumptionAmount as number, unit: input.unit as string, cost: input.cost as number | undefined, consumptionDate: input.consumptionDate as string, reportingPeriod: input.reportingPeriod as string, efficiencyRating: input.efficiencyRating as number | undefined, intensityMetric: input.intensityMetric as number | undefined, recordedBy: userId, notes: input.notes as string | undefined });
    await audit({ action: 'environment.resource.create', entity: 'resource_usage', entityId: usage.id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async updateResourceUsage(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['resourceType','consumptionAmount','unit','cost','consumptionDate','reportingPeriod','efficiencyRating','intensityMetric','isVerified','notes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const usage = await resourceUsageRepo.update(id, orgId, patch as any);
    if (!usage) throw new NotFoundError('Resource usage record not found');
    await audit({ action: 'environment.resource.update', entity: 'resource_usage', entityId: id, organizationId: orgId, actorId: userId });
    return usage;
  },
  async deleteResourceUsage(orgId: string, id: string, userId?: string) {
    const existing = await resourceUsageRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Resource usage record not found');
    await resourceUsageRepo.softDelete(id, orgId);
    await audit({ action: 'environment.resource.delete', entity: 'resource_usage', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Environmental Projects
  async listProjects(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalProjectRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, projectType: filter.projectType as EnvironmentalProjectType | undefined, status: filter.status as ProjectStatus | undefined });
  },
  async getProject(orgId: string, id: string) {
    const project = await environmentalProjectRepo.findById(id, orgId);
    if (!project) throw new NotFoundError('Environmental project not found');
    return project;
  },
  async createProject(orgId: string, input: Record<string, unknown>, userId?: string) {
    const project = await environmentalProjectRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, projectName: input.projectName as string, description: input.description as string | undefined, projectType: input.projectType as EnvironmentalProjectType, status: input.status as ProjectStatus | undefined, budget: input.budget as number | undefined, actualCost: input.actualCost as number | undefined, startDate: input.startDate as string | undefined, endDate: input.endDate as string | undefined, ownerId: input.ownerId as string | undefined, location: input.location as string | undefined, areaCovered: input.areaCovered as number | undefined, treesPlanted: input.treesPlanted as number | undefined, evidenceUrls: input.evidenceUrls as string[] | undefined, progressNotes: input.progressNotes as string | undefined });
    await audit({ action: 'environment.project.create', entity: 'environmental_project', entityId: project.id, organizationId: orgId, actorId: userId });
    return project;
  },
  async updateProject(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['projectName','description','projectType','status','budget','actualCost','startDate','endDate','ownerId','location','areaCovered','treesPlanted','evidenceUrls','progressNotes'];
    for (const f of fields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    const project = await environmentalProjectRepo.update(id, orgId, patch as any);
    if (!project) throw new NotFoundError('Environmental project not found');
    await audit({ action: 'environment.project.update', entity: 'environmental_project', entityId: id, organizationId: orgId, actorId: userId });
    return project;
  },
  async deleteProject(orgId: string, id: string, userId?: string) {
    const existing = await environmentalProjectRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental project not found');
    await environmentalProjectRepo.softDelete(id, orgId);
    await audit({ action: 'environment.project.delete', entity: 'environmental_project', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },
};
