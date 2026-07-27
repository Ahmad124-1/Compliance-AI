import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { facilityRepo } from '../repositories/facility.repo.js';
import { ghgScopeRepo } from '../repositories/ghg-scope.repo.js';
import { emissionSourceRepo } from '../repositories/emission-source.repo.js';
import { emissionRecordRepo } from '../repositories/emission-record.repo.js';
import { emissionFactorRepo } from '../repositories/emission-factor.repo.js';
import { carbonProjectRepo } from '../repositories/carbon-project.repo.js';
import { carbonOffsetRepo } from '../repositories/carbon-offset.repo.js';
import { reductionTargetRepo } from '../repositories/reduction-target.repo.js';
import { carbonReportRepo } from '../repositories/carbon-report.repo.js';
import { calculationHistoryRepo } from '../repositories/calculation-history.repo.js';
import type { FacilityType, EmissionSourceCategory, EmissionSourceType, CalculationMethod, FactorType, ProjectType, ProjectStatus, OffsetType, VerificationStatus, TargetType, TargetStatus, CarbonReportType, ReportFormat } from '../types/carbon.js';

export const carbonService = {
  async getDashboard(orgId: string) {
    const records = await emissionRecordRepo.listByOrganization(orgId);
    const totalEmissions = records.reduce((sum, r) => sum + Number(r.co2e), 0);
    const scopes = await ghgScopeRepo.listByOrganization(orgId);
    const scope1 = records.filter(r => r.scopeId && scopes.find(s => s.id === r.scopeId && s.scopeNumber === 1)).reduce((sum, r) => sum + Number(r.co2e), 0);
    const scope2 = records.filter(r => r.scopeId && scopes.find(s => s.id === r.scopeId && s.scopeNumber === 2)).reduce((sum, r) => sum + Number(r.co2e), 0);
    const scope3 = records.filter(r => r.scopeId && scopes.find(s => s.id === r.scopeId && s.scopeNumber === 3)).reduce((sum, r) => sum + Number(r.co2e), 0);
    const facilities = await facilityRepo.listByOrganization(orgId);
    const projects = await carbonProjectRepo.listByOrganization(orgId);
    const offsets = await carbonOffsetRepo.listByOrganization(orgId);
    const totalCreditsRetired = offsets.reduce((sum, o) => sum + Number(o.creditsRetired), 0);
    const totalOffsets = offsets.reduce((sum, o) => sum + Number(o.creditsPurchased), 0);
    const targets = await reductionTargetRepo.listByOrganization(orgId);
    const netEmissions = Math.max(0, totalEmissions - totalCreditsRetired);
    const sourceMap = new Map<string, number>();
    for (const r of records) {
      sourceMap.set(r.activityType, (sourceMap.get(r.activityType) || 0) + Number(r.co2e));
    }
    const topSources = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([sourceName, co2e]) => ({ sourceName, co2e: parseFloat(co2e.toFixed(2)) }));
    const monthlyMap = new Map<string, { scope1: number; scope2: number; scope3: number }>();
    for (const r of records) {
      const month = r.emissionDate.slice(0, 7);
      const cur = monthlyMap.get(month) || { scope1: 0, scope2: 0, scope3: 0 };
      const sn = r.scopeId ? scopes.find(s => s.id === r.scopeId)?.scopeNumber : 0;
      if (sn === 1) cur.scope1 += Number(r.co2e);
      else if (sn === 2) cur.scope2 += Number(r.co2e);
      else cur.scope3 += Number(r.co2e);
      monthlyMap.set(month, cur);
    }
    const monthlyEmissions = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, scope1: parseFloat(v.scope1.toFixed(2)), scope2: parseFloat(v.scope2.toFixed(2)), scope3: parseFloat(v.scope3.toFixed(2)) }));
    const yearlyMap = new Map<string, number>();
    for (const r of records) {
      const year = r.emissionDate.slice(0, 4);
      yearlyMap.set(year, (yearlyMap.get(year) || 0) + Number(r.co2e));
    }
    const yearlyEmissions = Array.from(yearlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, total]) => ({ year, total: parseFloat(total.toFixed(2)) }));
    const facilityMap = new Map<string, number>();
    for (const r of records) {
      if (r.facilityId) {
        const fac = facilities.find(f => f.id === r.facilityId);
        if (fac) facilityMap.set(fac.name, (facilityMap.get(fac.name) || 0) + Number(r.co2e));
      }
    }
    const facilityComparison = Array.from(facilityMap.entries()).sort((a, b) => b[1] - a[1]).map(([facilityName, emissions]) => ({ facilityName, emissions: parseFloat(emissions.toFixed(2)) }));
    const reductionProgress = targets.length ? Math.round(targets.filter(t => t.status === 'achieved').length / targets.length * 100) : 0;
    const intensity = totalEmissions > 0 ? parseFloat((totalEmissions / Math.max(facilities.filter(f => f.isActive).length, 1)).toFixed(2)) : 0;
    return {
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      scope1Emissions: parseFloat(scope1.toFixed(2)),
      scope2Emissions: parseFloat(scope2.toFixed(2)),
      scope3Emissions: parseFloat(scope3.toFixed(2)),
      carbonIntensity: intensity,
      totalFacilities: facilities.filter(f => f.isActive).length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      totalOffsets: parseFloat(totalOffsets.toFixed(2)),
      totalCreditsRetired: parseFloat(totalCreditsRetired.toFixed(2)),
      netEmissions: parseFloat(netEmissions.toFixed(2)),
      reductionTargetsCount: targets.length,
      achievedTargetsCount: targets.filter(t => t.status === 'achieved').length,
      topEmissionSources: topSources,
      monthlyEmissions,
      yearlyEmissions,
      reductionProgress,
      facilityComparison,
    };
  },

  async listFacilities(orgId: string, filter: Record<string, unknown> = {}) {
    return facilityRepo.listByOrganization(orgId, { facilityType: filter.facilityType as FacilityType | undefined });
  },
  async getFacility(orgId: string, id: string) {
    const facility = await facilityRepo.findById(id, orgId);
    if (!facility) throw new NotFoundError('Facility not found');
    return facility;
  },
  async createFacility(orgId: string, input: Record<string, unknown>) {
    const facility = await facilityRepo.create({ organizationId: orgId, name: input.name as string, facilityType: input.facilityType as FacilityType, address: (input.address as Record<string, unknown>) ?? {}, latitude: input.latitude as number | undefined, longitude: input.longitude as number | undefined });
    await audit({ action: 'carbon.facility.create', entity: 'facility', entityId: facility.id, organizationId: orgId });
    return facility;
  },
  async updateFacility(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.facilityType !== undefined) patch.facilityType = input.facilityType as FacilityType;
    if (input.address !== undefined) patch.address = input.address;
    if (input.latitude !== undefined) patch.latitude = input.latitude;
    if (input.longitude !== undefined) patch.longitude = input.longitude;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const facility = await facilityRepo.update(id, orgId, patch);
    if (!facility) throw new NotFoundError('Facility not found');
    await audit({ action: 'carbon.facility.update', entity: 'facility', entityId: id, organizationId: orgId });
    return facility;
  },
  async deleteFacility(orgId: string, id: string) {
    const existing = await facilityRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Facility not found');
    await facilityRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.facility.delete', entity: 'facility', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listEmissionSources(orgId: string, filter: Record<string, unknown> = {}) {
    return emissionSourceRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, sourceCategory: filter.sourceCategory as EmissionSourceCategory | undefined, sourceType: filter.sourceType as EmissionSourceType | undefined });
  },
  async getEmissionSource(orgId: string, id: string) {
    const source = await emissionSourceRepo.findById(id, orgId);
    if (!source) throw new NotFoundError('Emission source not found');
    return source;
  },
  async createEmissionSource(orgId: string, input: Record<string, unknown>) {
    const source = await emissionSourceRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, name: input.name as string, description: input.description as string | undefined, sourceCategory: input.sourceCategory as EmissionSourceCategory, sourceType: input.sourceType as EmissionSourceType, scopeId: input.scopeId as string | undefined });
    await audit({ action: 'carbon.emission_source.create', entity: 'emission_source', entityId: source.id, organizationId: orgId });
    return source;
  },
  async updateEmissionSource(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.sourceCategory !== undefined) patch.sourceCategory = input.sourceCategory as EmissionSourceCategory;
    if (input.sourceType !== undefined) patch.sourceType = input.sourceType as EmissionSourceType;
    if (input.facilityId !== undefined) patch.facilityId = input.facilityId;
    if (input.scopeId !== undefined) patch.scopeId = input.scopeId;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const source = await emissionSourceRepo.update(id, orgId, patch);
    if (!source) throw new NotFoundError('Emission source not found');
    await audit({ action: 'carbon.emission_source.update', entity: 'emission_source', entityId: id, organizationId: orgId });
    return source;
  },
  async deleteEmissionSource(orgId: string, id: string) {
    const existing = await emissionSourceRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Emission source not found');
    await emissionSourceRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.emission_source.delete', entity: 'emission_source', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listScopes(orgId: string) {
    return ghgScopeRepo.listByOrganization(orgId);
  },
  async getScope(orgId: string, id: string) {
    const scope = await ghgScopeRepo.findById(id, orgId);
    if (!scope) throw new NotFoundError('GHG scope not found');
    return scope;
  },
  async createScope(orgId: string, input: Record<string, unknown>) {
    const scope = await ghgScopeRepo.create({ organizationId: orgId, name: input.name as string, scopeNumber: input.scopeNumber as 1 | 2 | 3, description: input.description as string | undefined });
    await audit({ action: 'carbon.scope.create', entity: 'ghg_scope', entityId: scope.id, organizationId: orgId });
    return scope;
  },
  async updateScope(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    const scope = await ghgScopeRepo.update(id, orgId, patch);
    if (!scope) throw new NotFoundError('GHG scope not found');
    await audit({ action: 'carbon.scope.update', entity: 'ghg_scope', entityId: id, organizationId: orgId });
    return scope;
  },

  async deleteScope(orgId: string, id: string) {
    const existing = await ghgScopeRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('GHG scope not found');
    await ghgScopeRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.scope.delete', entity: 'ghg_scope', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listEmissionRecords(orgId: string, filter: Record<string, unknown> = {}) {
    return emissionRecordRepo.listByOrganization(orgId, { facilityId: filter.facilityId as string | undefined, emissionSourceId: filter.emissionSourceId as string | undefined, scopeId: filter.scopeId as string | undefined, reportingPeriod: filter.reportingPeriod as string | undefined, emissionDate: filter.emissionDate as string | undefined });
  },
  async getEmissionRecord(orgId: string, id: string) {
    const record = await emissionRecordRepo.findById(id, orgId);
    if (!record) throw new NotFoundError('Emission record not found');
    return record;
  },
  async createEmissionRecord(orgId: string, input: Record<string, unknown>, userId?: string) {
    const record = await emissionRecordRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, emissionSourceId: input.emissionSourceId as string | undefined, scopeId: input.scopeId as string | undefined, activityType: input.activityType as string, activityData: (input.activityData as Record<string, unknown>) ?? {}, co2e: input.co2e as number, co2: input.co2 as number | undefined, ch4: input.ch4 as number | undefined, n2o: input.n2o as number | undefined, hfc: input.hfc as number | undefined, pfc: input.pfc as number | undefined, sf6: input.sf6 as number | undefined, unit: input.unit as string, emissionDate: input.emissionDate as string, reportingPeriod: input.reportingPeriod as string, calculationMethod: (input.calculationMethod as CalculationMethod) || 'standard', emissionFactorId: input.emissionFactorId as string | undefined, manualOverride: input.manualOverride as boolean || false, overrideReason: input.overrideReason as string | undefined, notes: input.notes as string | undefined, recordedBy: userId, isVerified: input.isVerified as boolean || false });
    await audit({ action: 'carbon.emission_record.create', entity: 'emission_record', entityId: record.id, organizationId: orgId, actorId: userId });
    return record;
  },
  async updateEmissionRecord(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const numericFields = ['co2e','co2','ch4','n2o','hfc','pfc','sf6'];
    for (const f of numericFields) { if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f]; }
    if (input.activityType !== undefined) patch.activityType = input.activityType;
    if (input.activityData !== undefined) patch.activityData = input.activityData;
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.emissionDate !== undefined) patch.emissionDate = input.emissionDate;
    if (input.reportingPeriod !== undefined) patch.reportingPeriod = input.reportingPeriod;
    if (input.calculationMethod !== undefined) patch.calculationMethod = input.calculationMethod as CalculationMethod;
    if (input.emissionFactorId !== undefined) patch.emissionFactorId = input.emissionFactorId;
    if (input.manualOverride !== undefined) patch.manualOverride = input.manualOverride;
    if (input.overrideReason !== undefined) patch.overrideReason = input.overrideReason;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.isVerified !== undefined) patch.isVerified = input.isVerified;
    const record = await emissionRecordRepo.update(id, orgId, patch);
    if (!record) throw new NotFoundError('Emission record not found');
    await audit({ action: 'carbon.emission_record.update', entity: 'emission_record', entityId: id, organizationId: orgId, actorId: userId });
    return record;
  },
  async deleteEmissionRecord(orgId: string, id: string, userId?: string) {
    const existing = await emissionRecordRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Emission record not found');
    await emissionRecordRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.emission_record.delete', entity: 'emission_record', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  async listEmissionFactors(orgId: string, filter: Record<string, unknown> = {}) {
    if (filter.activeOnly) return emissionFactorRepo.listActive(orgId);
    return emissionFactorRepo.listByOrganization(orgId, { factorType: filter.factorType as FactorType | undefined, category: filter.category as string | undefined });
  },
  async getEmissionFactor(orgId: string, id: string) {
    const factor = await emissionFactorRepo.findById(id, orgId);
    if (!factor) throw new NotFoundError('Emission factor not found');
    return factor;
  },
  async createEmissionFactor(orgId: string, input: Record<string, unknown>) {
    const factor = await emissionFactorRepo.create({ organizationId: orgId, name: input.name as string, description: input.description as string | undefined, factorType: input.factorType as FactorType, category: input.category as string, subcategory: input.subcategory as string | undefined, value: input.value as number, unit: input.unit as string, source: input.source as string, sourceUrl: input.sourceUrl as string | undefined, geography: input.geography as string | undefined, effectiveDate: input.effectiveDate as string, expiryDate: input.expiryDate as string | undefined, version: (input.version as number) || 1 });
    await audit({ action: 'carbon.emission_factor.create', entity: 'emission_factor', entityId: factor.id, organizationId: orgId });
    return factor;
  },
  async updateEmissionFactor(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.factorType !== undefined) patch.factorType = input.factorType as FactorType;
    if (input.category !== undefined) patch.category = input.category;
    if (input.subcategory !== undefined) patch.subcategory = input.subcategory;
    if (input.value !== undefined) patch.value = input.value;
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.source !== undefined) patch.source = input.source;
    if (input.sourceUrl !== undefined) patch.sourceUrl = input.sourceUrl;
    if (input.geography !== undefined) patch.geography = input.geography;
    if (input.effectiveDate !== undefined) patch.effectiveDate = input.effectiveDate;
    if (input.expiryDate !== undefined) patch.expiryDate = input.expiryDate;
    if (input.version !== undefined) patch.version = input.version;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const factor = await emissionFactorRepo.update(id, orgId, patch);
    if (!factor) throw new NotFoundError('Emission factor not found');
    await audit({ action: 'carbon.emission_factor.update', entity: 'emission_factor', entityId: id, organizationId: orgId });
    return factor;
  },

  async deleteEmissionFactor(orgId: string, id: string) {
    const existing = await emissionFactorRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Emission factor not found');
    await emissionFactorRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.emission_factor.delete', entity: 'emission_factor', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listCarbonProjects(orgId: string, filter: Record<string, unknown> = {}) {
    return carbonProjectRepo.listByOrganization(orgId, { projectType: filter.projectType as ProjectType | undefined, status: filter.status as ProjectStatus | undefined, facilityId: filter.facilityId as string | undefined });
  },
  async getCarbonProject(orgId: string, id: string) {
    const project = await carbonProjectRepo.findById(id, orgId);
    if (!project) throw new NotFoundError('Carbon project not found');
    return project;
  },
  async createCarbonProject(orgId: string, input: Record<string, unknown>) {
    const project = await carbonProjectRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, name: input.name as string, description: input.description as string | undefined, projectType: input.projectType as ProjectType, status: (input.status as ProjectStatus) || 'planning', budget: input.budget as number | undefined, ownerId: input.ownerId as string | undefined, startDate: input.startDate as string | undefined, endDate: input.endDate as string | undefined, expectedReductionTco2e: input.expectedReductionTco2e as number | undefined, actualReductionTco2e: input.actualReductionTco2e as number | undefined, roi: input.roi as number | undefined, evidence: input.evidence as string | undefined });
    await audit({ action: 'carbon.project.create', entity: 'carbon_project', entityId: project.id, organizationId: orgId });
    return project;
  },
  async updateCarbonProject(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.projectType !== undefined) patch.projectType = input.projectType as ProjectType;
    if (input.status !== undefined) patch.status = input.status as ProjectStatus;
    if (input.budget !== undefined) patch.budget = input.budget;
    if (input.ownerId !== undefined) patch.ownerId = input.ownerId;
    if (input.startDate !== undefined) patch.startDate = input.startDate;
    if (input.endDate !== undefined) patch.endDate = input.endDate;
    if (input.expectedReductionTco2e !== undefined) patch.expectedReductionTco2e = input.expectedReductionTco2e;
    if (input.actualReductionTco2e !== undefined) patch.actualReductionTco2e = input.actualReductionTco2e;
    if (input.roi !== undefined) patch.roi = input.roi;
    if (input.evidence !== undefined) patch.evidence = input.evidence;
    if (input.isVerified !== undefined) patch.isVerified = input.isVerified;
    if (input.verificationDate !== undefined) patch.verificationDate = input.verificationDate;
    const project = await carbonProjectRepo.update(id, orgId, patch);
    if (!project) throw new NotFoundError('Carbon project not found');
    await audit({ action: 'carbon.project.update', entity: 'carbon_project', entityId: id, organizationId: orgId });
    return project;
  },

  async deleteCarbonProject(orgId: string, id: string) {
    const existing = await carbonProjectRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Carbon project not found');
    await carbonProjectRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.project.delete', entity: 'carbon_project', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listCarbonOffsets(orgId: string, filter: Record<string, unknown> = {}) {
    return carbonOffsetRepo.listByOrganization(orgId, { projectId: filter.projectId as string | undefined, offsetType: filter.offsetType as OffsetType | undefined });
  },
  async getCarbonOffset(orgId: string, id: string) {
    const offset = await carbonOffsetRepo.findById(id, orgId);
    if (!offset) throw new NotFoundError('Carbon offset not found');
    return offset;
  },
  async createCarbonOffset(orgId: string, input: Record<string, unknown>) {
    const offset = await carbonOffsetRepo.create({ organizationId: orgId, projectId: input.projectId as string | undefined, name: input.name as string, description: input.description as string | undefined, offsetType: input.offsetType as OffsetType, registry: input.registry as string | undefined, registryId: input.registryId as string | undefined, creditsPurchased: input.creditsPurchased as number, creditsRetired: (input.creditsRetired as number) || 0, purchaseDate: input.purchaseDate as string, expiryDate: input.expiryDate as string | undefined, costPerTon: input.costPerTon as number | undefined, totalCost: input.totalCost as number | undefined, certificateUrl: input.certificateUrl as string | undefined, verificationStatus: (input.verificationStatus as VerificationStatus) || 'pending', verifiedBy: input.verifiedBy as string | undefined });
    await audit({ action: 'carbon.offset.create', entity: 'carbon_offset', entityId: offset.id, organizationId: orgId });
    return offset;
  },
  async updateCarbonOffset(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.offsetType !== undefined) patch.offsetType = input.offsetType as OffsetType;
    if (input.registry !== undefined) patch.registry = input.registry;
    if (input.registryId !== undefined) patch.registryId = input.registryId;
    if (input.creditsPurchased !== undefined) patch.creditsPurchased = input.creditsPurchased;
    if (input.creditsRetired !== undefined) patch.creditsRetired = input.creditsRetired;
    if (input.purchaseDate !== undefined) patch.purchaseDate = input.purchaseDate;
    if (input.expiryDate !== undefined) patch.expiryDate = input.expiryDate;
    if (input.costPerTon !== undefined) patch.costPerTon = input.costPerTon;
    if (input.totalCost !== undefined) patch.totalCost = input.totalCost;
    if (input.certificateUrl !== undefined) patch.certificateUrl = input.certificateUrl;
    if (input.verificationStatus !== undefined) patch.verificationStatus = input.verificationStatus as VerificationStatus;
    if (input.verifiedBy !== undefined) patch.verifiedBy = input.verifiedBy;
    if (input.verifiedAt !== undefined) patch.verifiedAt = input.verifiedAt;
    const offset = await carbonOffsetRepo.update(id, orgId, patch);
    if (!offset) throw new NotFoundError('Carbon offset not found');
    await audit({ action: 'carbon.offset.update', entity: 'carbon_offset', entityId: id, organizationId: orgId });
    return offset;
  },

  async deleteCarbonOffset(orgId: string, id: string) {
    const existing = await carbonOffsetRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Carbon offset not found');
    await carbonOffsetRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.offset.delete', entity: 'carbon_offset', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listReductionTargets(orgId: string, filter: Record<string, unknown> = {}) {
    return reductionTargetRepo.listByOrganization(orgId, { targetType: filter.targetType as TargetType | undefined, status: filter.status as TargetStatus | undefined, facilityId: filter.facilityId as string | undefined });
  },
  async getReductionTarget(orgId: string, id: string) {
    const target = await reductionTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('Reduction target not found');
    return target;
  },
  async createReductionTarget(orgId: string, input: Record<string, unknown>) {
    const target = await reductionTargetRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, scopeId: input.scopeId as string | undefined, name: input.name as string, description: input.description as string | undefined, targetType: input.targetType as TargetType, baselineEmissionsTco2e: input.baselineEmissionsTco2e as number, targetEmissionsTco2e: input.targetEmissionsTco2e as number, baselineYear: input.baselineYear as number, targetYear: input.targetYear as number, currentEmissionsTco2e: input.currentEmissionsTco2e as number | undefined, milestones: (input.milestones as Record<string, unknown>[]) || [] });
    await audit({ action: 'carbon.target.create', entity: 'reduction_target', entityId: target.id, organizationId: orgId });
    return target;
  },
  async updateReductionTarget(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.targetType !== undefined) patch.targetType = input.targetType as TargetType;
    if (input.baselineEmissionsTco2e !== undefined) patch.baselineEmissionsTco2e = input.baselineEmissionsTco2e;
    if (input.targetEmissionsTco2e !== undefined) patch.targetEmissionsTco2e = input.targetEmissionsTco2e;
    if (input.baselineYear !== undefined) patch.baselineYear = input.baselineYear;
    if (input.targetYear !== undefined) patch.targetYear = input.targetYear;
    if (input.currentEmissionsTco2e !== undefined) patch.currentEmissionsTco2e = input.currentEmissionsTco2e;
    if (input.progressPct !== undefined) patch.progressPct = input.progressPct;
    if (input.status !== undefined) patch.status = input.status as TargetStatus;
    if (input.milestones !== undefined) patch.milestones = input.milestones;
    const target = await reductionTargetRepo.update(id, orgId, patch);
    if (!target) throw new NotFoundError('Reduction target not found');
    await audit({ action: 'carbon.target.update', entity: 'reduction_target', entityId: id, organizationId: orgId });
    return target;
  },

  async deleteReductionTarget(orgId: string, id: string) {
    const existing = await reductionTargetRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Reduction target not found');
    await reductionTargetRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.target.delete', entity: 'reduction_target', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async listCarbonReports(orgId: string, filter: Record<string, unknown> = {}) {
    return carbonReportRepo.listByOrganization(orgId, { reportType: filter.reportType as CarbonReportType | undefined, status: filter.status as string | undefined });
  },
  async getCarbonReport(orgId: string, id: string) {
    const report = await carbonReportRepo.findById(id, orgId);
    if (!report) throw new NotFoundError('Carbon report not found');
    return report;
  },
  async createCarbonReport(orgId: string, input: Record<string, unknown>) {
    const report = await carbonReportRepo.create({ organizationId: orgId, facilityId: input.facilityId as string | undefined, name: input.name as string, description: input.description as string | undefined, reportType: input.reportType as CarbonReportType, format: (input.format as ReportFormat) || 'pdf', generatedBy: input.generatedBy as string | undefined, params: (input.params as Record<string, unknown>) || {} });
    await audit({ action: 'carbon.report.create', entity: 'carbon_report', entityId: report.id, organizationId: orgId });
    return report;
  },
  async updateCarbonReport(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.reportType !== undefined) patch.reportType = input.reportType as CarbonReportType;
    if (input.format !== undefined) patch.format = input.format as ReportFormat;
    if (input.status !== undefined) patch.status = input.status;
    if (input.fileUrl !== undefined) patch.fileUrl = input.fileUrl;
    if (input.summary !== undefined) patch.summary = input.summary;
    const report = await carbonReportRepo.update(id, orgId, patch);
    if (!report) throw new NotFoundError('Carbon report not found');
    await audit({ action: 'carbon.report.update', entity: 'carbon_report', entityId: id, organizationId: orgId });
    return report;
  },

  async deleteCarbonReport(orgId: string, id: string) {
    const existing = await carbonReportRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Carbon report not found');
    await carbonReportRepo.softDelete(id, orgId);
    await audit({ action: 'carbon.report.delete', entity: 'carbon_report', entityId: id, organizationId: orgId });
    return { success: true };
  },

  async calculateEmission(orgId: string, input: Record<string, unknown>, userId?: string) {
    const factors = await emissionFactorRepo.listActive(orgId);
    const matchedFactor = factors.find(f => f.category === input.category && f.factorType === input.factorType && (!f.geography || f.geography === input.geography));
    if (!matchedFactor) throw new NotFoundError('No matching emission factor found');
    const activityValue = Number(input.activityValue) || 0;
    const factorValue = Number(matchedFactor.value) || 0;
    const co2e = parseFloat((activityValue * factorValue).toFixed(4));
    const co2 = parseFloat((co2e * 0.95).toFixed(4));
    const ch4 = parseFloat((co2e * 0.03).toFixed(4));
    const n2o = parseFloat((co2e * 0.02).toFixed(4));
    const result: Record<string, unknown> = { co2e, co2, ch4, n2o, factorUsed: matchedFactor.name, factorValue, activityValue };
    const calcType = (input.calculationType as CalculationMethod) || 'standard';
    const history = await calculationHistoryRepo.create({ organizationId: orgId, emissionRecordId: undefined, calculationType: calcType, inputData: input as Record<string, unknown>, emissionFactorId: matchedFactor.id, resultCo2e: co2e, resultBreakdown: result, methodology: `Activity data (${input.activityValue}) × Emission factor (${matchedFactor.value} ${matchedFactor.unit}) = ${co2e} tCO2e`, calculatedBy: userId });
    await audit({ action: 'carbon.calculate', entity: 'calculation_history', entityId: history.id, organizationId: orgId, actorId: userId, metadata: { result: history.resultBreakdown } });
    return { result, calculationId: history.id, emissionFactor: matchedFactor };
  },

  async listCalculationHistory(orgId: string, filter: Record<string, unknown> = {}) {
    return calculationHistoryRepo.listByOrganization(orgId, { emissionRecordId: filter.emissionRecordId as string | undefined, calculationType: filter.calculationType as string | undefined });
  },
  async getCalculationHistory(orgId: string, id: string) {
    const history = await calculationHistoryRepo.findById(id, orgId);
    if (!history) throw new NotFoundError('Calculation history not found');
    return history;
  },
};
