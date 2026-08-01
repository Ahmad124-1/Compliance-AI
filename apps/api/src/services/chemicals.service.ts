import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { chemicalRepo } from '../repositories/chemical.repo.js';
import { chemicalContainerRepo } from '../repositories/chemical-container.repo.js';
import { chemicalSpillRepo } from '../repositories/chemical-spill.repo.js';

export const chemicalsService = {
  // Chemical Inventory CRUD
  async listChemicals(orgId: string, filter: Record<string, unknown> = {}) {
    return chemicalRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      siteId: filter.siteId as string | undefined,
      hazardClassification: filter.hazardClassification as any,
      approvalStatus: filter.approvalStatus as any,
      riskRating: filter.riskRating as any,
    });
  },
  async getChemical(orgId: string, id: string) {
    const chemical = await chemicalRepo.findById(id, orgId);
    if (!chemical) throw new NotFoundError('Chemical record not found');
    return chemical;
  },
  async createChemical(orgId: string, input: Record<string, unknown>, userId?: string) {
    const chemical = await chemicalRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      chemicalName: input.chemicalName as string,
      casNumber: input.casNumber as string | undefined,
      formula: input.formula as string | undefined,
      hazardClassification: input.hazardClassification as any,
      storageLocation: input.storageLocation as string | undefined,
      quantity: input.quantity as number,
      unit: input.unit as string | undefined,
      supplierId: input.supplierId as string | undefined,
      expiryDate: input.expiryDate as string | undefined,
      msdsUrl: input.msdsUrl as string | undefined,
      usageDescription: input.usageDescription as string | undefined,
      riskRating: input.riskRating as any,
      emergencyProcedures: input.emergencyProcedures as string | undefined,
      ppeRequirements: input.ppeRequirements as string | undefined,
      approvalStatus: input.approvalStatus as any,
      approvedBy: input.approvedBy as string | undefined,
      approvedAt: input.approvedAt as string | undefined,
      recordedBy: userId,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'chemicals.chemical.create', entity: 'chemical', entityId: chemical.id, organizationId: orgId, actorId: userId });
    return chemical;
  },
  async updateChemical(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['chemicalName','casNumber','formula','hazardClassification','storageLocation','quantity','unit','supplierId','expiryDate','msdsUrl','usageDescription','riskRating','emergencyProcedures','ppeRequirements','approvalStatus','approvedBy','approvedAt','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const chemical = await chemicalRepo.update(id, orgId, patch as any);
    if (!chemical) throw new NotFoundError('Chemical record not found');
    await audit({ action: 'chemicals.chemical.update', entity: 'chemical', entityId: id, organizationId: orgId, actorId: userId });
    return chemical;
  },
  async deleteChemical(orgId: string, id: string, userId?: string) {
    const existing = await chemicalRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Chemical record not found');
    await chemicalRepo.softDelete(id, orgId);
    await audit({ action: 'chemicals.chemical.delete', entity: 'chemical', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Containers
  async listContainers(orgId: string, filter: Record<string, unknown> = {}) {
    return chemicalContainerRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      chemicalId: filter.chemicalId as string | undefined,
      status: filter.status as string | undefined,
      containerType: filter.containerType as string | undefined,
    });
  },
  async getContainer(orgId: string, id: string) {
    const container = await chemicalContainerRepo.findById(id, orgId);
    if (!container) throw new NotFoundError('Chemical container not found');
    return container;
  },
  async createContainer(orgId: string, input: Record<string, unknown>, userId?: string) {
    const container = await chemicalContainerRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      chemicalId: input.chemicalId as string,
      containerType: input.containerType as string,
      capacity: input.capacity as number,
      capacityUnit: input.capacityUnit as string | undefined,
      currentQuantity: input.currentQuantity as number | undefined,
      quantityUnit: input.quantityUnit as string | undefined,
      storageLocation: input.storageLocation as string | undefined,
      storageArea: input.storageArea as string | undefined,
      hazardClassification: input.hazardClassification as string | undefined,
      status: input.status as string | undefined,
      fillDate: input.fillDate as string | undefined,
      emptyDate: input.emptyDate as string | undefined,
      inspectionFrequency: input.inspectionFrequency as string | undefined,
      lastInspectionDate: input.lastInspectionDate as string | undefined,
      nextInspectionDate: input.nextInspectionDate as string | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'chemicals.container.create', entity: 'chemical_container', entityId: container.id, organizationId: orgId, actorId: userId });
    return container;
  },
  async updateContainer(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['containerType','capacity','capacityUnit','currentQuantity','quantityUnit','storageLocation','storageArea','hazardClassification','status','fillDate','emptyDate','inspectionFrequency','lastInspectionDate','nextInspectionDate','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const container = await chemicalContainerRepo.update(id, orgId, patch as any);
    if (!container) throw new NotFoundError('Chemical container not found');
    await audit({ action: 'chemicals.container.update', entity: 'chemical_container', entityId: id, organizationId: orgId, actorId: userId });
    return container;
  },
  async deleteContainer(orgId: string, id: string, userId?: string) {
    const existing = await chemicalContainerRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Chemical container not found');
    await chemicalContainerRepo.softDelete(id, orgId);
    await audit({ action: 'chemicals.container.delete', entity: 'chemical_container', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Spill Records
  async listSpills(orgId: string, filter: Record<string, unknown> = {}) {
    return chemicalSpillRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      chemicalId: filter.chemicalId as string | undefined,
      incidentId: filter.incidentId as string | undefined,
      cleanupStatus: filter.cleanupStatus as string | undefined,
      startDate: filter.startDate as string | undefined,
      endDate: filter.endDate as string | undefined,
    });
  },
  async getSpill(orgId: string, id: string) {
    const spill = await chemicalSpillRepo.findById(id, orgId);
    if (!spill) throw new NotFoundError('Chemical spill record not found');
    return spill;
  },
  async createSpill(orgId: string, input: Record<string, unknown>, userId?: string) {
    const spill = await chemicalSpillRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      chemicalId: input.chemicalId as string | undefined,
      incidentId: input.incidentId as string | undefined,
      spillDate: input.spillDate as string | undefined,
      quantitySpilled: input.quantitySpilled as number,
      quantityUnit: input.quantityUnit as string | undefined,
      spillLocation: input.spillLocation as string,
      spillCause: input.spillCause as string | undefined,
      containmentAction: input.containmentAction as string | undefined,
      cleanupAction: input.cleanupAction as string | undefined,
      cleanupStatus: input.cleanupStatus as string | undefined,
      cleanupDate: input.cleanupDate as string | undefined,
      cleanedBy: input.cleanedBy as string | undefined,
      environmentalImpact: input.environmentalImpact as string | undefined,
      reportable: input.reportable as boolean | undefined,
      reportedToAuthority: input.reportedToAuthority as boolean | undefined,
      authorityName: input.authorityName as string | undefined,
      authorityReference: input.authorityReference as string | undefined,
      costs: input.costs as number | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'chemicals.spill.create', entity: 'chemical_spill', entityId: spill.id, organizationId: orgId, actorId: userId });
    return spill;
  },
  async updateSpill(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['quantitySpilled','quantityUnit','spillLocation','spillCause','containmentAction','cleanupAction','cleanupStatus','cleanupDate','cleanedBy','environmentalImpact','reportable','reportedToAuthority','authorityName','authorityReference','costs','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const spill = await chemicalSpillRepo.update(id, orgId, patch as any);
    if (!spill) throw new NotFoundError('Chemical spill record not found');
    await audit({ action: 'chemicals.spill.update', entity: 'chemical_spill', entityId: id, organizationId: orgId, actorId: userId });
    return spill;
  },
  async deleteSpill(orgId: string, id: string, userId?: string) {
    const existing = await chemicalSpillRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Chemical spill record not found');
    await chemicalSpillRepo.softDelete(id, orgId);
    await audit({ action: 'chemicals.spill.delete', entity: 'chemical_spill', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },
};
