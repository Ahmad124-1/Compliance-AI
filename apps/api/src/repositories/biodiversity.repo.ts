import { query } from '../db/pool.js';

export interface BiodiversityRecord {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  recordType: string;
  name: string;
  description: string | null;
  location: string | null;
  areaSize: number | null;
  areaUnit: string;
  treesPlanted: number;
  treesLost: number;
  speciesCount: number | null;
  speciesList: string[];
  protectedSpecies: string[];
  restorationArea: number | null;
  restorationStatus: string | null;
  communityParticipants: number | null;
  communityPartner: string | null;
  fundingAmount: number | null;
  fundingSource: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  evidenceUrls: string[];
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapBiodiversityRecord(row: any): BiodiversityRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    recordType: row.record_type,
    name: row.name,
    description: row.description,
    location: row.location,
    areaSize: row.area_size ? Number(row.area_size) : null,
    areaUnit: row.area_unit || 'hectares',
    treesPlanted: row.trees_planted || 0,
    treesLost: row.trees_lost || 0,
    speciesCount: row.species_count,
    speciesList: row.species_list || [],
    protectedSpecies: row.protected_species || [],
    restorationArea: row.restoration_area ? Number(row.restoration_area) : null,
    restorationStatus: row.restoration_status,
    communityParticipants: row.community_participants,
    communityPartner: row.community_partner,
    fundingAmount: row.funding_amount ? Number(row.funding_amount) : null,
    fundingSource: row.funding_source,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    evidenceUrls: row.evidence_urls || [],
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface BiodiversityFilter {
  facilityId?: string;
  recordType?: string;
  status?: string;
  restorationStatus?: string;
}

export const biodiversityRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    recordType: string;
    name: string;
    description?: string | null;
    location?: string | null;
    areaSize?: number | null;
    areaUnit?: string;
    treesPlanted?: number;
    treesLost?: number;
    speciesCount?: number | null;
    speciesList?: string[];
    protectedSpecies?: string[];
    restorationArea?: number | null;
    restorationStatus?: string | null;
    communityParticipants?: number | null;
    communityPartner?: string | null;
    fundingAmount?: number | null;
    fundingSource?: string | null;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    evidenceUrls?: string[];
    notes?: string | null;
  }): Promise<BiodiversityRecord> {
    const { rows } = await query<BiodiversityRecord>(
      `INSERT INTO biodiversity_records (organization_id, facility_id, site_id, record_type, name, description, location, area_size, area_unit, trees_planted, trees_lost, species_count, species_list, protected_species, restoration_area, restoration_status, community_participants, community_partner, funding_amount, funding_source, status, start_date, end_date, evidence_urls, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.recordType,
        input.name,
        input.description ?? null,
        input.location ?? null,
        input.areaSize ?? null,
        input.areaUnit ?? 'hectares',
        input.treesPlanted ?? 0,
        input.treesLost ?? 0,
        input.speciesCount ?? null,
        input.speciesList ?? [],
        input.protectedSpecies ?? [],
        input.restorationArea ?? null,
        input.restorationStatus ?? null,
        input.communityParticipants ?? null,
        input.communityPartner ?? null,
        input.fundingAmount ?? null,
        input.fundingSource ?? null,
        input.status ?? 'active',
        input.startDate ?? null,
        input.endDate ?? null,
        input.evidenceUrls ?? [],
        input.notes ?? null,
      ],
    );
    return mapBiodiversityRecord(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<BiodiversityRecord | null> {
    const { rows } = await query<BiodiversityRecord>(
      `SELECT * FROM biodiversity_records WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapBiodiversityRecord(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: BiodiversityFilter = {}): Promise<BiodiversityRecord[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.recordType) { where.push(`record_type = $${i++}`); params.push(filter.recordType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.restorationStatus) { where.push(`restoration_status = $${i++}`); params.push(filter.restorationStatus); }
    const { rows } = await query<BiodiversityRecord>(
      `SELECT * FROM biodiversity_records WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapBiodiversityRecord);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<BiodiversityRecord, 'name' | 'description' | 'location' | 'areaSize' | 'areaUnit' | 'treesPlanted' | 'treesLost' | 'speciesCount' | 'speciesList' | 'protectedSpecies' | 'restorationArea' | 'restorationStatus' | 'communityParticipants' | 'communityPartner' | 'fundingAmount' | 'fundingSource' | 'status' | 'startDate' | 'endDate' | 'evidenceUrls' | 'notes'>>): Promise<BiodiversityRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.location !== undefined) set('location', patch.location);
    if (patch.areaSize !== undefined) set('area_size', patch.areaSize);
    if (patch.areaUnit !== undefined) set('area_unit', patch.areaUnit);
    if (patch.treesPlanted !== undefined) set('trees_planted', patch.treesPlanted);
    if (patch.treesLost !== undefined) set('trees_lost', patch.treesLost);
    if (patch.speciesCount !== undefined) set('species_count', patch.speciesCount);
    if (patch.speciesList !== undefined) set('species_list', patch.speciesList);
    if (patch.protectedSpecies !== undefined) set('protected_species', patch.protectedSpecies);
    if (patch.restorationArea !== undefined) set('restoration_area', patch.restorationArea);
    if (patch.restorationStatus !== undefined) set('restoration_status', patch.restorationStatus);
    if (patch.communityParticipants !== undefined) set('community_participants', patch.communityParticipants);
    if (patch.communityPartner !== undefined) set('community_partner', patch.communityPartner);
    if (patch.fundingAmount !== undefined) set('funding_amount', patch.fundingAmount);
    if (patch.fundingSource !== undefined) set('funding_source', patch.fundingSource);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.endDate !== undefined) set('end_date', patch.endDate);
    if (patch.evidenceUrls !== undefined) set('evidence_urls', patch.evidenceUrls);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<BiodiversityRecord>(
      `UPDATE biodiversity_records SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapBiodiversityRecord(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE biodiversity_records SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

