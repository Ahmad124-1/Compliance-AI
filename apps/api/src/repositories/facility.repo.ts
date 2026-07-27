import { query } from '../db/pool.js';
import type { Facility, FacilityType } from '../types/carbon.js';

function mapFacility(row: any): Facility {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    facilityType: row.facility_type,
    address: row.address ?? {},
    latitude: row.latitude,
    longitude: row.longitude,
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FacilityFilter {
  facilityType?: FacilityType;
}

export const facilityRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    facilityType: FacilityType;
    address?: Record<string, unknown>;
    latitude?: number | null;
    longitude?: number | null;
    isActive?: boolean;
  }): Promise<Facility> {
    const { rows } = await query<Facility>(
      `INSERT INTO facilities (organization_id, name, facility_type, address, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.facilityType,
        input.address ?? {},
        input.latitude ?? null,
        input.longitude ?? null,
        input.isActive ?? true,
      ],
    );
    return mapFacility(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<Facility | null> {
    const { rows } = await query<Facility>(
      `SELECT * FROM facilities WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapFacility(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: FacilityFilter = {}): Promise<Facility[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityType) {
      where.push(`facility_type = $${i++}`);
      params.push(filter.facilityType);
    }
    const { rows } = await query<Facility>(
      `SELECT * FROM facilities WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapFacility);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<Facility, 'name' | 'facilityType' | 'address' | 'latitude' | 'longitude' | 'isActive'>>): Promise<Facility | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.facilityType !== undefined) set('facility_type', patch.facilityType);
    if (patch.address !== undefined) set('address', patch.address);
    if (patch.latitude !== undefined) set('latitude', patch.latitude);
    if (patch.longitude !== undefined) set('longitude', patch.longitude);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<Facility>(
      `UPDATE facilities SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapFacility(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE facilities SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
