import { query } from '../db/pool.js';

export interface ChemicalSpill {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  chemicalId: string | null;
  incidentId: string | null;
  spillDate: string;
  quantitySpilled: number;
  quantityUnit: string;
  spillLocation: string;
  spillCause: string | null;
  containmentAction: string | null;
  cleanupAction: string | null;
  cleanupStatus: string;
  cleanupDate: string | null;
  cleanedBy: string | null;
  environmentalImpact: string | null;
  reportable: boolean;
  reportedToAuthority: boolean;
  authorityName: string | null;
  authorityReference: string | null;
  costs: number | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapChemicalSpill(row: any): ChemicalSpill {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    chemicalId: row.chemical_id,
    incidentId: row.incident_id,
    spillDate: row.spill_date,
    quantitySpilled: Number(row.quantity_spilled),
    quantityUnit: row.quantity_unit,
    spillLocation: row.spill_location,
    spillCause: row.spill_cause,
    containmentAction: row.containment_action,
    cleanupAction: row.cleanup_action,
    cleanupStatus: row.cleanup_status,
    cleanupDate: row.cleanup_date,
    cleanedBy: row.cleaned_by,
    environmentalImpact: row.environmental_impact,
    reportable: row.reportable,
    reportedToAuthority: row.reported_to_authority,
    authorityName: row.authority_name,
    authorityReference: row.authority_reference,
    costs: row.costs ? Number(row.costs) : null,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ChemicalSpillFilter {
  facilityId?: string;
  chemicalId?: string;
  incidentId?: string;
  cleanupStatus?: string;
  startDate?: string;
  endDate?: string;
}

export const chemicalSpillRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    chemicalId?: string | null;
    incidentId?: string | null;
    spillDate?: string;
    quantitySpilled: number;
    quantityUnit?: string;
    spillLocation: string;
    spillCause?: string | null;
    containmentAction?: string | null;
    cleanupAction?: string | null;
    cleanupStatus?: string;
    cleanupDate?: string | null;
    cleanedBy?: string | null;
    environmentalImpact?: string | null;
    reportable?: boolean;
    reportedToAuthority?: boolean;
    authorityName?: string | null;
    authorityReference?: string | null;
    costs?: number | null;
    notes?: string | null;
  }): Promise<ChemicalSpill> {
    const { rows } = await query<ChemicalSpill>(
      `INSERT INTO chemical_spill_records (organization_id, facility_id, site_id, chemical_id, incident_id, spill_date, quantity_spilled, quantity_unit, spill_location, spill_cause, containment_action, cleanup_action, cleanup_status, cleanup_date, cleaned_by, environmental_impact, reportable, reported_to_authority, authority_name, authority_reference, costs, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.chemicalId ?? null,
        input.incidentId ?? null,
        input.spillDate ?? new Date().toISOString(),
        input.quantitySpilled,
        input.quantityUnit ?? 'liters',
        input.spillLocation,
        input.spillCause ?? null,
        input.containmentAction ?? null,
        input.cleanupAction ?? null,
        input.cleanupStatus ?? 'pending',
        input.cleanupDate ?? null,
        input.cleanedBy ?? null,
        input.environmentalImpact ?? null,
        input.reportable ?? false,
        input.reportedToAuthority ?? false,
        input.authorityName ?? null,
        input.authorityReference ?? null,
        input.costs ?? null,
        input.notes ?? null,
      ],
    );
    return mapChemicalSpill(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<ChemicalSpill | null> {
    const { rows } = await query<ChemicalSpill>(
      `SELECT * FROM chemical_spill_records WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapChemicalSpill(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ChemicalSpillFilter = {}): Promise<ChemicalSpill[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.chemicalId) { where.push(`chemical_id = $${i++}`); params.push(filter.chemicalId); }
    if (filter.incidentId) { where.push(`incident_id = $${i++}`); params.push(filter.incidentId); }
    if (filter.cleanupStatus) { where.push(`cleanup_status = $${i++}`); params.push(filter.cleanupStatus); }
    if (filter.startDate) { where.push(`spill_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`spill_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<ChemicalSpill>(
      `SELECT * FROM chemical_spill_records WHERE ${where.join(' AND ')} ORDER BY spill_date DESC`,
      params,
    );
    return rows.map(mapChemicalSpill);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<ChemicalSpill, 'quantitySpilled' | 'quantityUnit' | 'spillLocation' | 'spillCause' | 'containmentAction' | 'cleanupAction' | 'cleanupStatus' | 'cleanupDate' | 'cleanedBy' | 'environmentalImpact' | 'reportable' | 'reportedToAuthority' | 'authorityName' | 'authorityReference' | 'costs' | 'notes'>>): Promise<ChemicalSpill | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.quantitySpilled !== undefined) set('quantity_spilled', patch.quantitySpilled);
    if (patch.quantityUnit !== undefined) set('quantity_unit', patch.quantityUnit);
    if (patch.spillLocation !== undefined) set('spill_location', patch.spillLocation);
    if (patch.spillCause !== undefined) set('spill_cause', patch.spillCause);
    if (patch.containmentAction !== undefined) set('containment_action', patch.containmentAction);
    if (patch.cleanupAction !== undefined) set('cleanup_action', patch.cleanupAction);
    if (patch.cleanupStatus !== undefined) set('cleanup_status', patch.cleanupStatus);
    if (patch.cleanupDate !== undefined) set('cleanup_date', patch.cleanupDate);
    if (patch.cleanedBy !== undefined) set('cleaned_by', patch.cleanedBy);
    if (patch.environmentalImpact !== undefined) set('environmental_impact', patch.environmentalImpact);
    if (patch.reportable !== undefined) set('reportable', patch.reportable);
    if (patch.reportedToAuthority !== undefined) set('reported_to_authority', patch.reportedToAuthority);
    if (patch.authorityName !== undefined) set('authority_name', patch.authorityName);
    if (patch.authorityReference !== undefined) set('authority_reference', patch.authorityReference);
    if (patch.costs !== undefined) set('costs', patch.costs);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<ChemicalSpill>(
      `UPDATE chemical_spill_records SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapChemicalSpill(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE chemical_spill_records SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

