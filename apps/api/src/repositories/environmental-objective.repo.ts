import { query } from '../db/pool.js';

export interface EnvironmentalObjective {
  id: string;
  organizationId: string;
  facilityId: string | null;
  departmentId: string | null;
  parentObjectiveId: string | null;
  linkedGoalId: string | null;
  linkedProgramId: string | null;
  name: string;
  description: string | null;
  objectiveType: string;
  priority: string;
  baselineValue: number | null;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  startDate: string;
  targetDate: string;
  completionDate: string | null;
  progressPct: number;
  status: string;
  ownerId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  evidenceUrls: string[];
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveMilestone {
  id: string;
  objectiveId: string;
  name: string;
  description: string | null;
  targetValue: number | null;
  currentValue: number | null;
  targetDate: string;
  completionDate: string | null;
  status: string;
  ownerId: string | null;
  sortOrder: number;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapEnvironmentalObjective(row: any): EnvironmentalObjective {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    departmentId: row.department_id,
    parentObjectiveId: row.parent_objective_id,
    linkedGoalId: row.linked_goal_id,
    linkedProgramId: row.linked_program_id,
    name: row.name,
    description: row.description,
    objectiveType: row.objective_type,
    priority: row.priority,
    baselineValue: row.baseline_value ? Number(row.baseline_value) : null,
    targetValue: Number(row.target_value),
    currentValue: row.current_value ? Number(row.current_value) : null,
    unit: row.unit,
    startDate: row.start_date,
    targetDate: row.target_date,
    completionDate: row.completion_date,
    progressPct: Number(row.progress_pct),
    status: row.status,
    ownerId: row.owner_id,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    evidenceUrls: row.evidence_urls || [],
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapObjectiveMilestone(row: any): ObjectiveMilestone {
  return {
    id: row.id,
    objectiveId: row.objective_id,
    name: row.name,
    description: row.description,
    targetValue: row.target_value ? Number(row.target_value) : null,
    currentValue: row.current_value ? Number(row.current_value) : null,
    targetDate: row.target_date,
    completionDate: row.completion_date,
    status: row.status,
    ownerId: row.owner_id,
    sortOrder: row.sort_order,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EnvironmentalObjectiveFilter {
  facilityId?: string;
  departmentId?: string;
  objectiveType?: string;
  status?: string;
  priority?: string;
}

export const environmentalObjectiveRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    departmentId?: string | null;
    parentObjectiveId?: string | null;
    linkedGoalId?: string | null;
    linkedProgramId?: string | null;
    name: string;
    description?: string | null;
    objectiveType: string;
    priority?: string;
    baselineValue?: number | null;
    targetValue: number;
    currentValue?: number | null;
    unit?: string | null;
    startDate: string;
    targetDate: string;
    completionDate?: string | null;
    progressPct?: number;
    status?: string;
    ownerId?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    evidenceUrls?: string[];
    notes?: string | null;
  }): Promise<EnvironmentalObjective> {
    const { rows } = await query<EnvironmentalObjective>(
      `INSERT INTO environmental_objectives (organization_id, facility_id, department_id, parent_objective_id, linked_goal_id, linked_program_id, name, description, objective_type, priority, baseline_value, target_value, current_value, unit, start_date, target_date, completion_date, progress_pct, status, owner_id, approved_by, approved_at, evidence_urls, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.departmentId ?? null,
        input.parentObjectiveId ?? null,
        input.linkedGoalId ?? null,
        input.linkedProgramId ?? null,
        input.name,
        input.description ?? null,
        input.objectiveType,
        input.priority ?? 'medium',
        input.baselineValue ?? null,
        input.targetValue,
        input.currentValue ?? null,
        input.unit ?? null,
        input.startDate,
        input.targetDate,
        input.completionDate ?? null,
        input.progressPct ?? 0,
        input.status ?? 'draft',
        input.ownerId ?? null,
        input.approvedBy ?? null,
        input.approvedAt ?? null,
        input.evidenceUrls ?? [],
        input.notes ?? null,
      ],
    );
    return mapEnvironmentalObjective(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EnvironmentalObjective | null> {
    const { rows } = await query<EnvironmentalObjective>(
      `SELECT * FROM environmental_objectives WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEnvironmentalObjective(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EnvironmentalObjectiveFilter = {}): Promise<EnvironmentalObjective[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.departmentId) { where.push(`department_id = $${i++}`); params.push(filter.departmentId); }
    if (filter.objectiveType) { where.push(`objective_type = $${i++}`); params.push(filter.objectiveType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.priority) { where.push(`priority = $${i++}`); params.push(filter.priority); }
    const { rows } = await query<EnvironmentalObjective>(
      `SELECT * FROM environmental_objectives WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEnvironmentalObjective);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EnvironmentalObjective, 'name' | 'description' | 'objectiveType' | 'priority' | 'baselineValue' | 'targetValue' | 'currentValue' | 'unit' | 'startDate' | 'targetDate' | 'completionDate' | 'progressPct' | 'status' | 'ownerId' | 'approvedBy' | 'approvedAt' | 'evidenceUrls' | 'notes'>>): Promise<EnvironmentalObjective | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.objectiveType !== undefined) set('objective_type', patch.objectiveType);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.baselineValue !== undefined) set('baseline_value', patch.baselineValue);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.currentValue !== undefined) set('current_value', patch.currentValue);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.startDate !== undefined) set('start_date', patch.startDate);
    if (patch.targetDate !== undefined) set('target_date', patch.targetDate);
    if (patch.completionDate !== undefined) set('completion_date', patch.completionDate);
    if (patch.progressPct !== undefined) set('progress_pct', patch.progressPct);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.approvedBy !== undefined) set('approved_by', patch.approvedBy);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (patch.evidenceUrls !== undefined) set('evidence_urls', patch.evidenceUrls);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EnvironmentalObjective>(
      `UPDATE environmental_objectives SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEnvironmentalObjective(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE environmental_objectives SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },

  // Milestone operations
  async createMilestone(input: {
    objectiveId: string;
    name: string;
    description?: string | null;
    targetValue?: number | null;
    currentValue?: number | null;
    targetDate: string;
    completionDate?: string | null;
    status?: string;
    ownerId?: string | null;
    sortOrder?: number;
    notes?: string | null;
  }): Promise<ObjectiveMilestone> {
    const { rows } = await query<ObjectiveMilestone>(
      `INSERT INTO objective_milestones (objective_id, name, description, target_value, current_value, target_date, completion_date, status, owner_id, sort_order, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        input.objectiveId,
        input.name,
        input.description ?? null,
        input.targetValue ?? null,
        input.currentValue ?? null,
        input.targetDate,
        input.completionDate ?? null,
        input.status ?? 'pending',
        input.ownerId ?? null,
        input.sortOrder ?? 0,
        input.notes ?? null,
      ],
    );
    return mapObjectiveMilestone(rows[0]);
  },

  async listMilestonesByObjective(objectiveId: string): Promise<ObjectiveMilestone[]> {
    const { rows } = await query<ObjectiveMilestone>(
      `SELECT * FROM objective_milestones WHERE objective_id = $1 AND is_deleted = FALSE ORDER BY sort_order ASC`,
      [objectiveId],
    );
    return rows.map(mapObjectiveMilestone);
  },

  async updateMilestone(id: string, patch: Partial<Pick<ObjectiveMilestone, 'name' | 'description' | 'targetValue' | 'currentValue' | 'targetDate' | 'completionDate' | 'status' | 'ownerId' | 'sortOrder' | 'notes'>>): Promise<ObjectiveMilestone | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.currentValue !== undefined) set('current_value', patch.currentValue);
    if (patch.targetDate !== undefined) set('target_date', patch.targetDate);
    if (patch.completionDate !== undefined) set('completion_date', patch.completionDate);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.sortOrder !== undefined) set('sort_order', patch.sortOrder);
    if (patch.notes !== undefined) set('notes', patch.notes);
if (!sets.length) return null;
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query<ObjectiveMilestone>(
      `UPDATE objective_milestones SET ${sets.join(', ')} WHERE id = $${i} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapObjectiveMilestone(rows[0]) : null;
  },

  async deleteMilestone(id: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE objective_milestones SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND is_deleted = FALSE`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};

