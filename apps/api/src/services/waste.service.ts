import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { wasteRecordRepo } from '../repositories/waste-record.repo.js';
import { wasteVendorRepo } from '../repositories/waste-vendor.repo.js';
import { wasteTargetRepo } from '../repositories/waste-target.repo.js';

export const wasteService = {
  // Waste Records CRUD
  async listRecords(orgId: string, filter: Record<string, unknown> = {}) {
    return wasteRecordRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      siteId: filter.siteId as string | undefined,
      wasteType: filter.wasteType as any,
      startDate: filter.startDate as string | undefined,
      endDate: filter.endDate as string | undefined,
    });
  },
  async getRecord(orgId: string, id: string) {
    const record = await wasteRecordRepo.findById(id, orgId);
    if (!record) throw new NotFoundError('Waste record not found');
    return record;
  },
  async createRecord(orgId: string, input: Record<string, unknown>, userId?: string) {
    const record = await wasteRecordRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      wasteType: input.wasteType as any,
      quantity: input.quantity as number,
      unit: input.unit as string | undefined,
      weight: input.weight as number | undefined,
      disposalMethod: input.disposalMethod as string,
      recyclerId: input.recyclerId as string | undefined,
      vendorId: input.vendorId as string | undefined,
      manifestNumber: input.manifestNumber as string | undefined,
      certificateUrl: input.certificateUrl as string | undefined,
      hazardousDetails: input.hazardousDetails as string | undefined,
      wasteDate: input.wasteDate as string,
      cost: input.cost as number | undefined,
      recordedBy: userId,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'waste.record.create', entity: 'waste_record', entityId: record.id, organizationId: orgId, actorId: userId });
    return record;
  },
  async updateRecord(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['wasteType','quantity','unit','weight','disposalMethod','recyclerId','vendorId','manifestNumber','certificateUrl','hazardousDetails','wasteDate','cost','isVerified','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const record = await wasteRecordRepo.update(id, orgId, patch as any);
    if (!record) throw new NotFoundError('Waste record not found');
    await audit({ action: 'waste.record.update', entity: 'waste_record', entityId: id, organizationId: orgId, actorId: userId });
    return record;
  },
  async deleteRecord(orgId: string, id: string, userId?: string) {
    const existing = await wasteRecordRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Waste record not found');
    await wasteRecordRepo.softDelete(id, orgId);
    await audit({ action: 'waste.record.delete', entity: 'waste_record', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Waste Vendors
  async listVendors(orgId: string, filter: Record<string, unknown> = {}) {
    return wasteVendorRepo.listByOrganization(orgId, {
      vendorType: filter.vendorType as string | undefined,
      isApproved: filter.isApproved as boolean | undefined,
      wasteType: filter.wasteType as string | undefined,
    });
  },
  async getVendor(orgId: string, id: string) {
    const vendor = await wasteVendorRepo.findById(id, orgId);
    if (!vendor) throw new NotFoundError('Waste vendor not found');
    return vendor;
  },
  async createVendor(orgId: string, input: Record<string, unknown>, userId?: string) {
    const vendor = await wasteVendorRepo.create({
      organizationId: orgId,
      name: input.name as string,
      vendorType: input.vendorType as string,
      contactPerson: input.contactPerson as string | undefined,
      email: input.email as string | undefined,
      phone: input.phone as string | undefined,
      address: input.address as string | undefined,
      licenseNumber: input.licenseNumber as string | undefined,
      licenseExpiry: input.licenseExpiry as string | undefined,
      wasteTypesAccepted: input.wasteTypesAccepted as string[] | undefined,
      certifications: input.certifications as string[] | undefined,
      contractStart: input.contractStart as string | undefined,
      contractEnd: input.contractEnd as string | undefined,
      pricingNotes: input.pricingNotes as string | undefined,
      isApproved: input.isApproved as boolean | undefined,
      approvalDate: input.approvalDate as string | undefined,
      rating: input.rating as number | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'waste.vendor.create', entity: 'waste_vendor', entityId: vendor.id, organizationId: orgId, actorId: userId });
    return vendor;
  },
  async updateVendor(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','vendorType','contactPerson','email','phone','address','licenseNumber','licenseExpiry','wasteTypesAccepted','certifications','contractStart','contractEnd','pricingNotes','isApproved','approvalDate','rating','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const vendor = await wasteVendorRepo.update(id, orgId, patch as any);
    if (!vendor) throw new NotFoundError('Waste vendor not found');
    await audit({ action: 'waste.vendor.update', entity: 'waste_vendor', entityId: id, organizationId: orgId, actorId: userId });
    return vendor;
  },
  async deleteVendor(orgId: string, id: string, userId?: string) {
    const existing = await wasteVendorRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Waste vendor not found');
    await wasteVendorRepo.softDelete(id, orgId);
    await audit({ action: 'waste.vendor.delete', entity: 'waste_vendor', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Waste Targets
  async listTargets(orgId: string, filter: Record<string, unknown> = {}) {
    return wasteTargetRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      departmentId: filter.departmentId as string | undefined,
      wasteType: filter.wasteType as string | undefined,
      targetType: filter.targetType as string | undefined,
      status: filter.status as string | undefined,
    });
  },
  async getTarget(orgId: string, id: string) {
    const target = await wasteTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('Waste target not found');
    return target;
  },
  async createTarget(orgId: string, input: Record<string, unknown>, userId?: string) {
    const target = await wasteTargetRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      wasteType: input.wasteType as string,
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
    await audit({ action: 'waste.target.create', entity: 'waste_target', entityId: target.id, organizationId: orgId, actorId: userId });
    return target;
  },
  async updateTarget(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','wasteType','targetType','baselineValue','targetValue','currentValue','unit','baselineYear','targetYear','progressPct','status','ownerId','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const target = await wasteTargetRepo.update(id, orgId, patch as any);
    if (!target) throw new NotFoundError('Waste target not found');
    await audit({ action: 'waste.target.update', entity: 'waste_target', entityId: id, organizationId: orgId, actorId: userId });
    return target;
  },
  async deleteTarget(orgId: string, id: string, userId?: string) {
    const existing = await wasteTargetRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Waste target not found');
    await wasteTargetRepo.softDelete(id, orgId);
    await audit({ action: 'waste.target.delete', entity: 'waste_target', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Waste KPIs
  async getKpis(orgId: string, filter: { facilityId?: string; startDate?: string; endDate?: string } = {}) {
    const records = await wasteRecordRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
    const totalGenerated = records.reduce((s, r) => s + r.quantity, 0);
    const hazardousWaste = records.filter(r => r.wasteType === 'hazardous').reduce((s, r) => s + r.quantity, 0);
    const recycledWaste = records.filter(r => r.wasteType === 'plastic' || r.wasteType === 'paper' || r.wasteType === 'metal' || r.wasteType === 'organic').reduce((s, r) => s + r.quantity, 0);
    const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);
    return {
      totalGenerated: parseFloat(totalGenerated.toFixed(2)),
      hazardousWaste: parseFloat(hazardousWaste.toFixed(2)),
      recycledWaste: parseFloat(recycledWaste.toFixed(2)),
      recyclingRate: totalGenerated > 0 ? parseFloat(((recycledWaste / totalGenerated) * 100).toFixed(2)) : 0,
      totalCost: parseFloat(totalCost.toFixed(2)),
      recordCount: records.length,
      wasteTypeBreakdown: this.getWasteTypeBreakdown(records),
    };
  },
  getWasteTypeBreakdown(records: any[]) {
    const breakdown: Record<string, number> = {};
    for (const r of records) {
      breakdown[r.wasteType] = (breakdown[r.wasteType] || 0) + r.quantity;
    }
    return Object.entries(breakdown).map(([wasteType, quantity]) => ({ wasteType, quantity: parseFloat(quantity.toFixed(2)) }));
  },
};
