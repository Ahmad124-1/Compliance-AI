import { query } from '../db/pool.js';
import type { WasteRecord, WasteType } from '../types/environment.js';

function mapWasteRecord(row: any): WasteRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    departmentId: row.department_id,
    wasteType: row.waste_type,
    quantity: Number(row.quantity),
    unit: row.unit,
    weight: row.weight ? Number(row.weight) : null,
    disposalMethod: row.disposal_method,
    recyclerId: row.recycler_id,
    vendorId: row.vendor_id,
    manifestNumber: row.manifest_number,
    certificateUrl: row.certificate_url,
    hazardousDetails: row.hazardous_details,
    wasteDate: row.waste_date,
    cost: row.cost ? Number(row.cost) : null,
    recordedBy: row.recorded_by,
    isVerified: row.is_verified,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface WasteRecordFilter {
  facilityId?: string;
  siteId?: string;
  wasteType?: WasteType;
  startDate?: string;
  endDate?: string;
}

export const wasteRecordRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    departmentId?: string | null;
    wasteType: WasteType;
    quantity: number;
    unit?: string;
    weight?: number | null;
    disposalMethod: string;
    recyclerId?: string | null;
    vendorId?: string | null;
    manifestNumber?: string | null;
    certificateUrl?: string | null;
    hazardousDetails?: string | null;
    wasteDate: string;
    cost?: number | null;
    recordedBy?: string | null;
    notes?: string | null;
  }): Promise<WasteRecord> {
    const { rows } = await query<WasteRecord>(
      `INSERT INTO waste_records (organization_id, facility_id, site_id, department_id, waste_type, quantity, unit, weight, disposal_method, recycler_id, vendor_id, manifest_number, certificate_url, hazardous_details, waste_date, cost, recorded_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.wasteType,
        input.quantity,
        input.unit ?? 'kg',
        input.weight ?? null,
        input.disposalMethod,
        input.recyclerId ?? null,
        input.vendorId ?? null,
        input.manifestNumber ?? null,
        input.certificateUrl ?? null,
        input.hazardousDetails ?? null,
        input.wasteDate,
        input.cost ?? null,
        input.recordedBy ?? null,
        input.notes ?? null,
      ],
    );
    return mapWasteRecord(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<WasteRecord | null> {
    const { rows } = await query<WasteRecord>(
      `SELECT * FROM waste_records WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapWasteRecord(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: WasteRecordFilter = {}): Promise<WasteRecord[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.wasteType) { where.push(`waste_type = $${i++}`); params.push(filter.wasteType); }
    if (filter.startDate) { where.push(`waste_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`waste_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<WasteRecord>(
      `SELECT * FROM waste_records WHERE ${where.join(' AND ')} ORDER BY waste_date DESC`,
      params,
    );
    return rows.map(mapWasteRecord);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<WasteRecord, 'wasteType' | 'quantity' | 'unit' | 'weight' | 'disposalMethod' | 'recyclerId' | 'vendorId' | 'manifestNumber' | 'certificateUrl' | 'hazardousDetails' | 'wasteDate' | 'cost' | 'isVerified' | 'notes'>>): Promise<WasteRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.wasteType !== undefined) set('waste_type', patch.wasteType);
    if (patch.quantity !== undefined) set('quantity', patch.quantity);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.weight !== undefined) set('weight', patch.weight);
    if (patch.disposalMethod !== undefined) set('disposal_method', patch.disposalMethod);
    if (patch.recyclerId !== undefined) set('recycler_id', patch.recyclerId);
    if (patch.vendorId !== undefined) set('vendor_id', patch.vendorId);
    if (patch.manifestNumber !== undefined) set('manifest_number', patch.manifestNumber);
    if (patch.certificateUrl !== undefined) set('certificate_url', patch.certificateUrl);
    if (patch.hazardousDetails !== undefined) set('hazardous_details', patch.hazardousDetails);
    if (patch.wasteDate !== undefined) set('waste_date', patch.wasteDate);
    if (patch.cost !== undefined) set('cost', patch.cost);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<WasteRecord>(
      `UPDATE waste_records SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapWasteRecord(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE waste_records SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
