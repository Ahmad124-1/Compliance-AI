import { query } from '../db/pool.js';
import type { Chemical, HazardClassification, RiskRating, ApprovalStatus } from '../types/environment.js';

function mapChemical(row: any): Chemical {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    chemicalName: row.chemical_name,
    casNumber: row.cas_number,
    formula: row.formula,
    hazardClassification: row.hazard_classification,
    storageLocation: row.storage_location,
    quantity: Number(row.quantity),
    unit: row.unit,
    supplierId: row.supplier_id,
    expiryDate: row.expiry_date,
    msdsUrl: row.msds_url,
    usageDescription: row.usage_description,
    riskRating: row.risk_rating,
    emergencyProcedures: row.emergency_procedures,
    ppeRequirements: row.ppe_requirements,
    approvalStatus: row.approval_status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    recordedBy: row.recorded_by,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ChemicalFilter {
  facilityId?: string;
  siteId?: string;
  hazardClassification?: HazardClassification;
  approvalStatus?: ApprovalStatus;
  riskRating?: RiskRating;
}

export const chemicalRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    chemicalName: string;
    casNumber?: string | null;
    formula?: string | null;
    hazardClassification: HazardClassification;
    storageLocation?: string | null;
    quantity: number;
    unit?: string;
    supplierId?: string | null;
    expiryDate?: string | null;
    msdsUrl?: string | null;
    usageDescription?: string | null;
    riskRating?: RiskRating | null;
    emergencyProcedures?: string | null;
    ppeRequirements?: string | null;
    approvalStatus?: ApprovalStatus;
    approvedBy?: string | null;
    approvedAt?: string | null;
    recordedBy?: string | null;
    notes?: string | null;
  }): Promise<Chemical> {
    const { rows } = await query<Chemical>(
      `INSERT INTO chemicals (organization_id, facility_id, site_id, chemical_name, cas_number, formula, hazard_classification, storage_location, quantity, unit, supplier_id, expiry_date, msds_url, usage_description, risk_rating, emergency_procedures, ppe_requirements, approval_status, approved_by, approved_at, recorded_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.chemicalName,
        input.casNumber ?? null,
        input.formula ?? null,
        input.hazardClassification,
        input.storageLocation ?? null,
        input.quantity,
        input.unit ?? 'kg',
        input.supplierId ?? null,
        input.expiryDate ?? null,
        input.msdsUrl ?? null,
        input.usageDescription ?? null,
        input.riskRating ?? null,
        input.emergencyProcedures ?? null,
        input.ppeRequirements ?? null,
        input.approvalStatus ?? 'pending',
        input.approvedBy ?? null,
        input.approvedAt ?? null,
        input.recordedBy ?? null,
        input.notes ?? null,
      ],
    );
    return mapChemical(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<Chemical | null> {
    const { rows } = await query<Chemical>(
      `SELECT * FROM chemicals WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapChemical(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ChemicalFilter = {}): Promise<Chemical[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.hazardClassification) { where.push(`hazard_classification = $${i++}`); params.push(filter.hazardClassification); }
    if (filter.approvalStatus) { where.push(`approval_status = $${i++}`); params.push(filter.approvalStatus); }
    if (filter.riskRating) { where.push(`risk_rating = $${i++}`); params.push(filter.riskRating); }
    const { rows } = await query<Chemical>(
      `SELECT * FROM chemicals WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapChemical);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<Chemical, 'chemicalName' | 'casNumber' | 'formula' | 'hazardClassification' | 'storageLocation' | 'quantity' | 'unit' | 'supplierId' | 'expiryDate' | 'msdsUrl' | 'usageDescription' | 'riskRating' | 'emergencyProcedures' | 'ppeRequirements' | 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'notes'>>): Promise<Chemical | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.chemicalName !== undefined) set('chemical_name', patch.chemicalName);
    if (patch.casNumber !== undefined) set('cas_number', patch.casNumber);
    if (patch.formula !== undefined) set('formula', patch.formula);
    if (patch.hazardClassification !== undefined) set('hazard_classification', patch.hazardClassification);
    if (patch.storageLocation !== undefined) set('storage_location', patch.storageLocation);
    if (patch.quantity !== undefined) set('quantity', patch.quantity);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.supplierId !== undefined) set('supplier_id', patch.supplierId);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.msdsUrl !== undefined) set('msds_url', patch.msdsUrl);
    if (patch.usageDescription !== undefined) set('usage_description', patch.usageDescription);
    if (patch.riskRating !== undefined) set('risk_rating', patch.riskRating);
    if (patch.emergencyProcedures !== undefined) set('emergency_procedures', patch.emergencyProcedures);
    if (patch.ppeRequirements !== undefined) set('ppe_requirements', patch.ppeRequirements);
    if (patch.approvalStatus !== undefined) set('approval_status', patch.approvalStatus);
    if (patch.approvedBy !== undefined) set('approved_by', patch.approvedBy);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<Chemical>(
      `UPDATE chemicals SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapChemical(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE chemicals SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
