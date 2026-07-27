import { query } from '../db/pool.js';
import type { EsgGoal } from '../types/sustainability.js';

function mapGoal(row: any): EsgGoal {
  return {
    id: row.id,
    organizationId: row.organization_id,
    programId: row.program_id,
    name: row.name,
    description: row.description,
    esgPillar: row.esg_pillar,
    baseline: row.baseline,
    targetValue: row.target_value,
    unit: row.unit,
    currentValue: row.current_value,
    deadline: row.deadline,
    ownerId: row.owner_id,
    progressPct: parseFloat(row.progress_pct) ?? 0,
    status: row.status,
    confidence: row.confidence,
    riskLevel: row.risk_level,
    linkedSdgs: row.linked_sdgs ?? [],
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GoalFilter {
  search?: string;
  esgPillar?: string;
  status?: string;
  programId?: string;
  ownerId?: string;
}

export const esgGoalRepo = {
  async create(input: {
    organizationId: string;
    programId?: string;
    name: string;
    description?: string;
    esgPillar: string;
    baseline?: number;
    targetValue: number;
    unit?: string;
    currentValue?: number;
    deadline?: string;
    ownerId?: string;
    confidence?: string;
    riskLevel?: string;
    linkedSdgs?: number[];
  }): Promise<EsgGoal> {
    const { rows } = await query<EsgGoal>(
      `INSERT INTO esg_goals (organization_id, program_id, name, description, esg_pillar, baseline, target_value, unit, current_value, deadline, owner_id, confidence, risk_level, linked_sdgs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.programId ?? null,
        input.name,
        input.description ?? null,
        input.esgPillar,
        input.baseline ?? null,
        input.targetValue,
        input.unit ?? '%',
        input.currentValue ?? null,
        input.deadline ?? null,
        input.ownerId ?? null,
        input.confidence ?? 'medium',
        input.riskLevel ?? 'low',
        input.linkedSdgs ?? [],
      ],
    );
    return mapGoal(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgGoal | null> {
    const { rows } = await query<EsgGoal>(
      `SELECT * FROM esg_goals WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapGoal(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: GoalFilter = {}): Promise<EsgGoal[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`name ILIKE $${i++}`);
      params.push(`%${filter.search}%`);
    }
    if (filter.esgPillar) {
      where.push(`esg_pillar = $${i++}`);
      params.push(filter.esgPillar);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.programId) {
      where.push(`program_id = $${i++}`);
      params.push(filter.programId);
    }
    if (filter.ownerId) {
      where.push(`owner_id = $${i++}`);
      params.push(filter.ownerId);
    }
    const { rows } = await query<EsgGoal>(
      `SELECT * FROM esg_goals WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapGoal);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgGoal, 'name' | 'description' | 'esgPillar' | 'baseline' | 'targetValue' | 'unit' | 'currentValue' | 'deadline' | 'ownerId' | 'progressPct' | 'status' | 'confidence' | 'riskLevel' | 'linkedSdgs'>>): Promise<EsgGoal | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.esgPillar !== undefined) set('esg_pillar', patch.esgPillar);
    if (patch.baseline !== undefined) set('baseline', patch.baseline);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.currentValue !== undefined) set('current_value', patch.currentValue);
    if (patch.deadline !== undefined) set('deadline', patch.deadline);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.progressPct !== undefined) set('progress_pct', patch.progressPct);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.confidence !== undefined) set('confidence', patch.confidence);
    if (patch.riskLevel !== undefined) set('risk_level', patch.riskLevel);
    if (patch.linkedSdgs !== undefined) set('linked_sdgs', patch.linkedSdgs);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgGoal>(
      `UPDATE esg_goals SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapGoal(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_goals SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },

  async getProgress(orgId: string): Promise<{ completed: number; inProgress: number; total: number }> {
    const { rows } = await query<{ completed: number; in_progress: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'achieved') AS completed,
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
         COUNT(*) AS total
       FROM esg_goals WHERE organization_id = $1 AND is_deleted = FALSE`,
      [orgId],
    );
    return { completed: rows[0].completed, inProgress: rows[0].in_progress, total: rows[0].total };
  },
};

