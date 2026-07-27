import { query } from '../db/pool.js';
import type { SustainabilityProgram } from '../types/sustainability.js';

function mapProgram(row: any): SustainabilityProgram {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category,
    ownerId: row.owner_id,
    departmentId: row.department_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    budget: row.budget,
    priority: row.priority,
    linkedStandards: row.linked_standards ?? [],
    linkedSdgs: row.linked_sdgs ?? [],
    linkedEsgPillars: row.linked_esg_pillars ?? [],
    evidenceCount: parseInt(row.evidence_count, 10) ?? 0,
    attachmentCount: parseInt(row.attachment_count, 10) ?? 0,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ProgramFilter {
  search?: string;
  category?: string;
  status?: string;
  departmentId?: string;
  ownerId?: string;
}

export const sustainabilityProgramRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    category: string;
    ownerId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: string;
    linkedStandards?: Record<string, unknown>[];
    linkedSdgs?: number[];
    linkedEsgPillars?: string[];
  }): Promise<SustainabilityProgram> {
    const { rows } = await query<SustainabilityProgram>(
      `INSERT INTO sustainability_programs (organization_id, name, description, category, owner_id, department_id, start_date, end_date, budget, priority, linked_standards, linked_sdgs, linked_esg_pillars)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.category,
        input.ownerId ?? null,
        input.departmentId ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.budget ?? null,
        input.priority ?? 'medium',
        input.linkedStandards ?? [],
        input.linkedSdgs ?? [],
        input.linkedEsgPillars ?? [],
      ],
    );
    return mapProgram(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityProgram | null> {
    const { rows } = await query<SustainabilityProgram>(
      `SELECT * FROM sustainability_programs WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapProgram(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ProgramFilter = {}): Promise<SustainabilityProgram[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`(name ILIKE $${i} OR description ILIKE $${i})`);
      params.push(`%${filter.search}%`);
      i++;
    }
    if (filter.category) {
      where.push(`category = $${i++}`);
      params.push(filter.category);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.departmentId) {
      where.push(`department_id = $${i++}`);
      params.push(filter.departmentId);
    }
    if (filter.ownerId) {
      where.push(`owner_id = $${i++}`);
      params.push(filter.ownerId);
    }
    const { rows } = await query<SustainabilityProgram>(
      `SELECT * FROM sustainability_programs WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapProgram);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SustainabilityProgram, 'name' | 'description' | 'category' | 'ownerId' | 'departmentId' | 'startDate' | 'endDate' | 'budget' | 'priority' | 'linkedStandards' | 'linkedSdgs' | 'linkedEsgPillars' | 'status'>>): Promise<SustainabilityProgram | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.endDate !== undefined) set('end_date', patch.endDate);
    if (patch.budget !== undefined) set('budget', patch.budget);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.linkedStandards !== undefined) set('linked_standards', patch.linkedStandards);
    if (patch.linkedSdgs !== undefined) set('linked_sdgs', patch.linkedSdgs);
    if (patch.linkedEsgPillars !== undefined) set('linked_esg_pillars', patch.linkedEsgPillars);
    if (patch.status !== undefined) set('status', patch.status);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SustainabilityProgram>(
      `UPDATE sustainability_programs SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapProgram(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_programs SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

