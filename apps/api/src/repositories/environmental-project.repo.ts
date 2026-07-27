import { query } from '../db/pool.js';
import type { EnvironmentalProject, EnvironmentalProjectType, ProjectStatus } from '../types/environment.js';

function mapEnvironmentalProject(row: any): EnvironmentalProject {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    projectName: row.project_name,
    description: row.description,
    projectType: row.project_type,
    status: row.status,
    budget: row.budget ? Number(row.budget) : null,
    actualCost: row.actual_cost ? Number(row.actual_cost) : null,
    startDate: row.start_date,
    endDate: row.end_date,
    ownerId: row.owner_id,
    location: row.location,
    areaCovered: row.area_covered ? Number(row.area_covered) : null,
    treesPlanted: row.trees_planted,
    evidenceUrls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [],
    progressNotes: row.progress_notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EnvironmentalProjectFilter {
  facilityId?: string;
  projectType?: EnvironmentalProjectType;
  status?: ProjectStatus;
}

export const environmentalProjectRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    projectName: string;
    description?: string | null;
    projectType: EnvironmentalProjectType;
    status?: ProjectStatus;
    budget?: number | null;
    actualCost?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    ownerId?: string | null;
    location?: string | null;
    areaCovered?: number | null;
    treesPlanted?: number | null;
    evidenceUrls?: string[];
    progressNotes?: string | null;
  }): Promise<EnvironmentalProject> {
    const { rows } = await query<EnvironmentalProject>(
      `INSERT INTO environmental_projects (organization_id, facility_id, project_name, description, project_type, status, budget, actual_cost, start_date, end_date, owner_id, location, area_covered, trees_planted, evidence_urls, progress_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.projectName,
        input.description ?? null,
        input.projectType,
        input.status ?? 'planning',
        input.budget ?? null,
        input.actualCost ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.ownerId ?? null,
        input.location ?? null,
        input.areaCovered ?? null,
        input.treesPlanted ?? null,
        input.evidenceUrls ?? [],
        input.progressNotes ?? null,
      ],
    );
    return mapEnvironmentalProject(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EnvironmentalProject | null> {
    const { rows } = await query<EnvironmentalProject>(
      `SELECT * FROM environmental_projects WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEnvironmentalProject(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EnvironmentalProjectFilter = {}): Promise<EnvironmentalProject[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.projectType) { where.push(`project_type = $${i++}`); params.push(filter.projectType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    const { rows } = await query<EnvironmentalProject>(
      `SELECT * FROM environmental_projects WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEnvironmentalProject);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EnvironmentalProject, 'projectName' | 'description' | 'projectType' | 'status' | 'budget' | 'actualCost' | 'startDate' | 'endDate' | 'ownerId' | 'location' | 'areaCovered' | 'treesPlanted' | 'evidenceUrls' | 'progressNotes'>>): Promise<EnvironmentalProject | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.projectName !== undefined) set('project_name', patch.projectName);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.projectType !== undefined) set('project_type', patch.projectType);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.budget !== undefined) set('budget', patch.budget);
    if (patch.actualCost !== undefined) set('actual_cost', patch.actualCost);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.endDate !== undefined) set('end_date', patch.endDate);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.location !== undefined) set('location', patch.location);
    if (patch.areaCovered !== undefined) set('area_covered', patch.areaCovered);
    if (patch.treesPlanted !== undefined) set('trees_planted', patch.treesPlanted);
    if (patch.evidenceUrls !== undefined) set('evidence_urls', patch.evidenceUrls);
    if (patch.progressNotes !== undefined) set('progress_notes', patch.progressNotes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EnvironmentalProject>(
      `UPDATE environmental_projects SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEnvironmentalProject(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE environmental_projects SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
