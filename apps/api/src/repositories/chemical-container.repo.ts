import { query } from '../db/pool.js';

export interface ChemicalContainer {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  chemicalId: string;
  containerType: string;
  capacity: number;
  capacityUnit: string;
  currentQuantity: number;
  quantityUnit: string;
  storageLocation: string | null;
  storageArea: string | null;
  hazardClassification: string | null;
  status: string;
  fillDate: string | null;
  emptyDate: string | null;
  inspectionFrequency: string;
  lastInspectionDate: string | null;
  nextInspectionDate: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapChemicalContainer(row: any): ChemicalContainer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    chemicalId: row.chemical_id,
    containerType: row.container_type,
    capacity: Number(row.capacity),
    capacityUnit: row.capacity_unit,
    currentQuantity: Number(row.current_quantity),
    quantityUnit: row.quantity_unit,
    storageLocation: row.storage_location,
    storageArea: row.storage_area,
    hazardClassification: row.hazard_classification,
    status: row.status,
    fillDate: row.fill_date,
    emptyDate: row.empty_date,
    inspectionFrequency: row.inspection_frequency,
    lastInspectionDate: row.last_inspection_date,
    nextInspectionDate: row.next_inspection_date,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ChemicalContainerFilter {
  facilityId?: string;
  chemicalId?: string;
  status?: string;
  containerType?: string;
}

export const chemicalContainerRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    chemicalId: string;
    containerType: string;
    capacity: number;
    capacityUnit?: string;
    currentQuantity?: number;
    quantityUnit?: string;
    storageLocation?: string | null;
    storageArea?: string | null;
    hazardClassification?: string | null;
    status?: string;
    fillDate?: string | null;
    emptyDate?: string | null;
    inspectionFrequency?: string;
    lastInspectionDate?: string | null;
    nextInspectionDate?: string | null;
    notes?: string | null;
  }): Promise<ChemicalContainer> {
    const { rows } = await query<ChemicalContainer>(
      `INSERT INTO chemical_containers (organization_id, facility_id, site_id, chemical_id, container_type, capacity, capacity_unit, current_quantity, quantity_unit, storage_location, storage_area, hazard_classification, status, fill_date, empty_date, inspection_frequency, last_inspection_date, next_inspection_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.chemicalId,
        input.containerType,
        input.capacity,
        input.capacityUnit ?? 'liters',
        input.currentQuantity ?? 0,
        input.quantityUnit ?? 'liters',
        input.storageLocation ?? null,
        input.storageArea ?? null,
        input.hazardClassification ?? null,
        input.status ?? 'in_use',
        input.fillDate ?? null,
        input.emptyDate ?? null,
        input.inspectionFrequency ?? 'monthly',
        input.lastInspectionDate ?? null,
        input.nextInspectionDate ?? null,
        input.notes ?? null,
      ],
    );
    return mapChemicalContainer(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<ChemicalContainer | null> {
    const { rows } = await query<ChemicalContainer>(
      `SELECT * FROM chemical_containers WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapChemicalContainer(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ChemicalContainerFilter = {}): Promise<ChemicalContainer[]> {
    const where: string[] = ['cc.organization_id = $1 AND cc.is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`cc.facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.chemicalId) { where.push(`cc.chemical_id = $${i++}`); params.push(filter.chemicalId); }
    if (filter.status) { where.push(`cc.status = $${i++}`); params.push(filter.status); }
    if (filter.containerType) { where.push(`cc.container_type = $${i++}`); params.push(filter.containerType); }
    const { rows } = await query<ChemicalContainer>(
      `SELECT cc.*, c.chemical_name FROM chemical_containers cc LEFT JOIN chemicals c ON c.id = cc.chemical_id WHERE ${where.join(' AND ')} ORDER BY cc.created_at DESC`,
      params,
    );
    return rows.map(mapChemicalContainer);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<ChemicalContainer, 'containerType' | 'capacity' | 'capacityUnit' | 'currentQuantity' | 'quantityUnit' | 'storageLocation' | 'storageArea' | 'hazardClassification' | 'status' | 'fillDate' | 'emptyDate' | 'inspectionFrequency' | 'lastInspectionDate' | 'nextInspectionDate' | 'notes'>>): Promise<ChemicalContainer | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.containerType !== undefined) set('container_type', patch.containerType);
    if (patch.capacity !== undefined) set('capacity', patch.capacity);
    if (patch.capacityUnit !== undefined) set('capacity_unit', patch.capacityUnit);
    if (patch.currentQuantity !== undefined) set('current_quantity', patch.currentQuantity);
    if (patch.quantityUnit !== undefined) set('quantity_unit', patch.quantityUnit);
    if (patch.storageLocation !== undefined) set('storage_location', patch.storageLocation);
    if (patch.storageArea !== undefined) set('storage_area', patch.storageArea);
    if (patch.hazardClassification !== undefined) set('hazard_classification', patch.hazardClassification);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.fillDate !== undefined) set('fill_date', patch.fillDate);
    if (patch.emptyDate !== undefined) set('empty_date', patch.emptyDate);
    if (patch.inspectionFrequency !== undefined) set('inspection_frequency', patch.inspectionFrequency);
    if (patch.lastInspectionDate !== undefined) set('last_inspection_date', patch.lastInspectionDate);
    if (patch.nextInspectionDate !== undefined) set('next_inspection_date', patch.nextInspectionDate);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<ChemicalContainer>(
      `UPDATE chemical_containers SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapChemicalContainer(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE chemical_containers SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

