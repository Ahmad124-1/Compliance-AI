import { query } from '../db/pool.js';
import type { CarbonProject, ProjectType, ProjectStatus } from '../types/carbon.js';

function mapCarbonProject(row: any): CarbonProject {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    name: row.name,
    description: row.description,
    projectType: row.project_type,
    status: row.status,
    budget: row.budget !== null ? parseFloat(row.budget) : null,
    ownerId: row.owner_id,
    startDate: row.start_date,
    endDate: row.end_date,
    expectedReductionTco2e: row.expected_reduction_tco2e !== null ? parseFloat(row.expected_reduction_tco2e) : null,
    actualReductionTco2e: row.actual_reduction_tco2e !== null ? parseFloat(row.actual_reduction_tco2e) : null,
    roi: row.roi !== null ? parseFloat(row.roi) : null,
    evidence: row.evidence,
    isVerified: row.is_verified,
    verificationDate: row.verification_date,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CarbonProjectFilter {
  projectType?: ProjectType;
  status?: ProjectStatus;
  facilityId?: string;
}

export const carbonProjectRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string;
    name: string;
    description?: string;
    projectType: ProjectType;
    status?: ProjectStatus;
    budget?: number;
    ownerId?: string;
    startDate?: string;
    endDate?: string;
    expectedReductionTco2e?: number;
    actualReductionTco2e?: number;
    roi?: number;
    evidence?: string;
    isVerified?: boolean;
    verificationDate?: string;
  }): Promise<CarbonProject> {
    const { rows } = await query<CarbonProject>(
      `INSERT INTO carbon_projects (organization_id, facility_id, name, description, project_type, status, budget, owner_id, start_date, end_date, expected_reduction_tco2e, actual_reduction_tco2e, roi, evidence, is_verified, verification_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.name,
        input.description ?? null,
        input.projectType,
        input.status ?? 'planning',
        input.budget ?? null,
        input.ownerId ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.expectedReductionTco2e ?? null,
        input.actualReductionTco2e ?? null,
        input.roi ?? null,
        input.evidence ?? null,
        input.isVerified ?? false,
        input.verificationDate ?? null,
      ],
    );
    return mapCarbonProject(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<CarbonProject | null> {
    const { rows } = await query<CarbonProject>(
      `SELECT * FROM carbon_projects WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapCarbonProject(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: CarbonProjectFilter = {}): Promise<CarbonProject[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.projectType) {
      where.push(`project_type = $${i++}`);
      params.push(filter.projectType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    const { rows } = await query<CarbonProject>(
      `SELECT * FROM carbon_projects WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapCarbonProject);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<CarbonProject, 'facilityId' | 'name' | 'description' | 'projectType' | 'status' | 'budget' | 'ownerId' | 'startDate' | 'endDate' | 'expectedReductionTco2e' | 'actualReductionTco2e' | 'roi' | 'evidence' | 'isVerified' | 'verificationDate'>>): Promise<CarbonProject | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.projectType !== undefined) set('project_type', patch.projectType);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.budget !== undefined) set('budget', patch.budget);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.endDate !== undefined) set('end_date', patch.endDate);
    if (patch.expectedReductionTco2e !== undefined) set('expected_reduction_tco2e', patch.expectedReductionTco2e);
    if (patch.actualReductionTco2e !== undefined) set('actual_reduction_tco2e', patch.actualReductionTco2e);
    if (patch.roi !== undefined) set('roi', patch.roi);
    if (patch.evidence !== undefined) set('evidence', patch.evidence);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.verificationDate !== undefined) set('verification_date', patch.verificationDate);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<CarbonProject>(
      `UPDATE carbon_projects SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapCarbonProject(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE carbon_projects SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
