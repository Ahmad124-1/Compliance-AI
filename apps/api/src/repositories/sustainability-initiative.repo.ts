import { query } from '../db/pool.js';
import type { SustainabilityInitiative } from '../types/sustainability.js';

function mapInitiative(row: any): SustainabilityInitiative {
  return {
    id: row.id,
    organizationId: row.organization_id,
    programId: row.program_id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    team: row.team,
    startDate: row.start_date,
    dueDate: row.due_date,
    budget: row.budget,
    expectedImpact: row.expected_impact,
    actualImpact: row.actual_impact,
    status: row.status,
    milestonesCount: parseInt(row.milestones_count, 10) ?? 0,
    evidenceCount: parseInt(row.evidence_count, 10) ?? 0,
    riskLevel: row.risk_level,
    linkedSdgs: row.linked_sdgs ?? [],
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InitiativeFilter {
  search?: string;
  programId?: string;
  status?: string;
  ownerId?: string;
}

export const sustainabilityInitiativeRepo = {
  async create(input: {
    organizationId: string;
    programId?: string;
    name: string;
    description?: string;
    ownerId?: string;
    team?: string;
    startDate?: string;
    dueDate?: string;
    budget?: number;
    expectedImpact?: string;
    actualImpact?: string;
    status?: string;
    riskLevel?: string;
    linkedSdgs?: number[];
  }): Promise<SustainabilityInitiative> {
    const { rows } = await query<SustainabilityInitiative>(
      `INSERT INTO sustainability_initiatives (organization_id, program_id, name, description, owner_id, team, start_date, due_date, budget, expected_impact, actual_impact, status, risk_level, linked_sdgs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.programId ?? null,
        input.name,
        input.description ?? null,
        input.ownerId ?? null,
        input.team ?? '',
        input.startDate ?? null,
        input.dueDate ?? null,
        input.budget ?? null,
        input.expectedImpact ?? null,
        input.actualImpact ?? null,
        input.status ?? 'planning',
        input.riskLevel ?? 'low',
        input.linkedSdgs ?? [],
      ],
    );
    return mapInitiative(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityInitiative | null> {
    const { rows } = await query<SustainabilityInitiative>(
      `SELECT * FROM sustainability_initiatives WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapInitiative(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: InitiativeFilter = {}): Promise<SustainabilityInitiative[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`name ILIKE $${i++}`);
      params.push(`%${filter.search}%`);
    }
    if (filter.programId) {
      where.push(`program_id = $${i++}`);
      params.push(filter.programId);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.ownerId) {
      where.push(`owner_id = $${i++}`);
      params.push(filter.ownerId);
    }
    const { rows } = await query<SustainabilityInitiative>(
      `SELECT * FROM sustainability_initiatives WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapInitiative);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SustainabilityInitiative, 'name' | 'description' | 'ownerId' | 'team' | 'startDate' | 'dueDate' | 'budget' | 'expectedImpact' | 'actualImpact' | 'status' | 'riskLevel' | 'linkedSdgs'>>): Promise<SustainabilityInitiative | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.team !== undefined) set('team', patch.team);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.budget !== undefined) set('budget', patch.budget);
    if (patch.expectedImpact !== undefined) set('expected_impact', patch.expectedImpact);
    if (patch.actualImpact !== undefined) set('actual_impact', patch.actualImpact);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.riskLevel !== undefined) set('risk_level', patch.riskLevel);
    if (patch.linkedSdgs !== undefined) set('linked_sdgs', patch.linkedSdgs);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SustainabilityInitiative>(
      `UPDATE sustainability_initiatives SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapInitiative(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_initiatives SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

