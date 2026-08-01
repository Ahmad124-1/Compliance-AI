import { query } from '../db/pool.js';
import type { SbtiTarget, SbtiTargetType, SbtiTargetCategory, SbtiScopeCoverage, SbtiPathwayType, SbtiTargetStatus, SbtiMilestone, SbtiMilestoneStatus } from '../types/carbon.js';

function mapSbtiTarget(row: any): SbtiTarget {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    scopeId: row.scope_id,
    name: row.name,
    description: row.description,
    targetType: row.target_type,
    targetCategory: row.target_category,
    baseYear: parseInt(row.base_year, 10),
    targetYear: parseInt(row.target_year, 10),
    baseYearEmissionsTco2e: parseFloat(row.base_year_emissions_tco2e),
    targetEmissionsTco2e: parseFloat(row.target_emissions_tco2e),
    currentEmissionsTco2e: row.current_emissions_tco2e !== null ? parseFloat(row.current_emissions_tco2e) : null,
    reductionPct: parseFloat(row.reduction_pct),
    progressPct: parseFloat(row.progress_pct),
    scopeCoverage: row.scope_coverage,
    pathwayType: row.pathway_type,
    status: row.status,
    validationBody: row.validation_body,
    validationDate: row.validation_date,
    validationDocumentUrl: row.validation_document_url,
    milestones: row.milestones ?? [],
    achievedEarly: row.achieved_early,
    isPublic: row.is_public,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSbtiMilestone(row: any): SbtiMilestone {
  return {
    id: row.id,
    sbtiTargetId: row.sbti_target_id,
    name: row.name,
    description: row.description,
    milestoneYear: parseInt(row.milestone_year, 10),
    targetEmissionsTco2e: parseFloat(row.target_emissions_tco2e),
    currentEmissionsTco2e: row.current_emissions_tco2e !== null ? parseFloat(row.current_emissions_tco2e) : null,
    status: row.status,
    achievedAt: row.achieved_at,
    notes: row.notes,
    sortOrder: parseInt(row.sort_order, 10),
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SbtiTargetFilter {
  targetType?: SbtiTargetType;
  status?: SbtiTargetStatus;
  facilityId?: string;
  scopeCoverage?: SbtiScopeCoverage;
}

export const sbtiTargetRepo = {
  // ---- SBTi Targets ----

  async create(input: {
    organizationId: string;
    facilityId?: string;
    scopeId?: string;
    name: string;
    description?: string;
    targetType: SbtiTargetType;
    targetCategory?: SbtiTargetCategory;
    baseYear: number;
    targetYear: number;
    baseYearEmissionsTco2e: number;
    targetEmissionsTco2e: number;
    currentEmissionsTco2e?: number;
    reductionPct: number;
    progressPct?: number;
    scopeCoverage?: SbtiScopeCoverage;
    pathwayType?: SbtiPathwayType;
    status?: SbtiTargetStatus;
    validationBody?: string;
    validationDate?: string;
    validationDocumentUrl?: string;
    milestones?: Record<string, unknown>[];
    achievedEarly?: boolean;
    isPublic?: boolean;
  }): Promise<SbtiTarget> {
    const { rows } = await query<SbtiTarget>(
      `INSERT INTO sbti_targets (organization_id, facility_id, scope_id, name, description, target_type, target_category, base_year, target_year, base_year_emissions_tco2e, target_emissions_tco2e, current_emissions_tco2e, reduction_pct, progress_pct, scope_coverage, pathway_type, status, validation_body, validation_date, validation_document_url, milestones, achieved_early, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.scopeId ?? null,
        input.name,
        input.description ?? null,
        input.targetType,
        input.targetCategory ?? 'absolute',
        input.baseYear,
        input.targetYear,
        input.baseYearEmissionsTco2e,
        input.targetEmissionsTco2e,
        input.currentEmissionsTco2e ?? null,
        input.reductionPct,
        input.progressPct ?? 0,
        input.scopeCoverage ?? 'scope1_scope2',
        input.pathwayType ?? 'linear',
        input.status ?? 'draft',
        input.validationBody ?? null,
        input.validationDate ?? null,
        input.validationDocumentUrl ?? null,
        JSON.stringify(input.milestones ?? []),
        input.achievedEarly ?? false,
        input.isPublic ?? false,
      ],
    );
    return mapSbtiTarget(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SbtiTarget | null> {
    const { rows } = await query<SbtiTarget>(
      `SELECT * FROM sbti_targets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapSbtiTarget(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: SbtiTargetFilter = {}): Promise<SbtiTarget[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.targetType) {
      where.push(`target_type = $${i++}`);
      params.push(filter.targetType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    if (filter.scopeCoverage) {
      where.push(`scope_coverage = $${i++}`);
      params.push(filter.scopeCoverage);
    }
    const { rows } = await query<SbtiTarget>(
      `SELECT * FROM sbti_targets WHERE ${where.join(' AND ')} ORDER BY target_year ASC, created_at DESC`,
      params,
    );
    return rows.map(mapSbtiTarget);
  },

  async listByFacility(orgId: string, facilityId: string): Promise<SbtiTarget[]> {
    const { rows } = await query<SbtiTarget>(
      `SELECT * FROM sbti_targets WHERE organization_id = $1 AND facility_id = $2 AND is_deleted = FALSE ORDER BY target_year ASC`,
      [orgId, facilityId],
    );
    return rows.map(mapSbtiTarget);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SbtiTarget, 'name' | 'description' | 'targetType' | 'targetCategory' | 'baseYear' | 'targetYear' | 'baseYearEmissionsTco2e' | 'targetEmissionsTco2e' | 'currentEmissionsTco2e' | 'reductionPct' | 'progressPct' | 'scopeCoverage' | 'pathwayType' | 'status' | 'validationBody' | 'validationDate' | 'validationDocumentUrl' | 'milestones' | 'achievedEarly' | 'isPublic'>>): Promise<SbtiTarget | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.targetType !== undefined) set('target_type', patch.targetType);
    if (patch.targetCategory !== undefined) set('target_category', patch.targetCategory);
    if (patch.baseYear !== undefined) set('base_year', patch.baseYear);
    if (patch.targetYear !== undefined) set('target_year', patch.targetYear);
    if (patch.baseYearEmissionsTco2e !== undefined) set('base_year_emissions_tco2e', patch.baseYearEmissionsTco2e);
    if (patch.targetEmissionsTco2e !== undefined) set('target_emissions_tco2e', patch.targetEmissionsTco2e);
    if (patch.currentEmissionsTco2e !== undefined) set('current_emissions_tco2e', patch.currentEmissionsTco2e);
    if (patch.reductionPct !== undefined) set('reduction_pct', patch.reductionPct);
    if (patch.progressPct !== undefined) set('progress_pct', patch.progressPct);
    if (patch.scopeCoverage !== undefined) set('scope_coverage', patch.scopeCoverage);
    if (patch.pathwayType !== undefined) set('pathway_type', patch.pathwayType);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.validationBody !== undefined) set('validation_body', patch.validationBody);
    if (patch.validationDate !== undefined) set('validation_date', patch.validationDate);
    if (patch.validationDocumentUrl !== undefined) set('validation_document_url', patch.validationDocumentUrl);
    if (patch.milestones !== undefined) set('milestones', JSON.stringify(patch.milestones));
    if (patch.achievedEarly !== undefined) set('achieved_early', patch.achievedEarly);
    if (patch.isPublic !== undefined) set('is_public', patch.isPublic);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SbtiTarget>(
      `UPDATE sbti_targets SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapSbtiTarget(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sbti_targets SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },

  async getProgressStats(orgId: string): Promise<{ total: number; active: number; achieved: number; atRisk: number; avgProgress: number }> {
    const { rows } = await query<Record<string, string>>(
      `SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE status = 'active')::text as active,
        COUNT(*) FILTER (WHERE status = 'achieved')::text as achieved,
        COUNT(*) FILTER (WHERE status = 'at_risk')::text as at_risk,
        COALESCE(AVG(progress_pct), 0)::text as avg
       FROM sbti_targets WHERE organization_id = $1 AND is_deleted = FALSE`,
      [orgId],
    );
    const r = rows[0];
    return {
      total: parseInt(r.total, 10),
      active: parseInt(r.active, 10),
      achieved: parseInt(r.achieved, 10),
      atRisk: parseInt(r.at_risk, 10),
      avgProgress: parseFloat(r.avg),
    };
  },

  // ---- SBTi Milestones ----

  async createMilestone(input: {
    sbtiTargetId: string;
    name: string;
    description?: string;
    milestoneYear: number;
    targetEmissionsTco2e: number;
    currentEmissionsTco2e?: number;
    status?: SbtiMilestoneStatus;
    notes?: string;
    sortOrder?: number;
  }): Promise<SbtiMilestone> {
    const { rows } = await query<SbtiMilestone>(
      `INSERT INTO sbti_milestones (sbti_target_id, name, description, milestone_year, target_emissions_tco2e, current_emissions_tco2e, status, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.sbtiTargetId,
        input.name,
        input.description ?? null,
        input.milestoneYear,
        input.targetEmissionsTco2e,
        input.currentEmissionsTco2e ?? null,
        input.status ?? 'pending',
        input.notes ?? null,
        input.sortOrder ?? 0,
      ],
    );
    return mapSbtiMilestone(rows[0]);
  },

  async listMilestones(targetId: string): Promise<SbtiMilestone[]> {
    const { rows } = await query<SbtiMilestone>(
      `SELECT * FROM sbti_milestones WHERE sbti_target_id = $1 AND is_deleted = FALSE ORDER BY milestone_year ASC, sort_order ASC`,
      [targetId],
    );
    return rows.map(mapSbtiMilestone);
  },

  async updateMilestone(id: string, patch: Partial<Pick<SbtiMilestone, 'name' | 'description' | 'milestoneYear' | 'targetEmissionsTco2e' | 'currentEmissionsTco2e' | 'status' | 'notes' | 'sortOrder'>>): Promise<SbtiMilestone | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.milestoneYear !== undefined) set('milestone_year', patch.milestoneYear);
    if (patch.targetEmissionsTco2e !== undefined) set('target_emissions_tco2e', patch.targetEmissionsTco2e);
    if (patch.currentEmissionsTco2e !== undefined) set('current_emissions_tco2e', patch.currentEmissionsTco2e);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (patch.sortOrder !== undefined) set('sort_order', patch.sortOrder);
    if (!sets.length) return null;
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query<SbtiMilestone>(
      `UPDATE sbti_milestones SET ${sets.join(', ')} WHERE id = $${i} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapSbtiMilestone(rows[0]) : null;
  },

  async deleteMilestone(id: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sbti_milestones SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND is_deleted = FALSE`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};

