import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import type { QueuedAction, ActionStatus, ActionType } from '../types.js';

interface ActionQueueRow {
  id: string;
  organization_id: string;
  rule_id: string | null;
  action_type: string;
  title: string;
  description: string | null;
  reason: string | null;
  confidence_score: string;
  data_used: Record<string, unknown>;
  impact: string | null;
  risk: string | null;
  estimated_time_saved: string | null;
  payload: Record<string, unknown>;
  status: string;
  priority: string;
  created_by: string | null;
  assigned_to: string | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  rolled_back_at: string | null;
  parent_action_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ActionQueueRow): QueuedAction {
  return {
    id: row.id, organizationId: row.organization_id, ruleId: row.rule_id ?? undefined,
    actionType: row.action_type, title: row.title, description: row.description ?? undefined,
    reason: row.reason ?? undefined, confidenceScore: parseFloat(row.confidence_score),
    dataUsed: row.data_used ?? {}, impact: row.impact ?? undefined, risk: row.risk ?? undefined,
    estimatedTimeSaved: row.estimated_time_saved ?? undefined, payload: row.payload ?? {},
    status: row.status as ActionStatus, priority: row.priority,
    createdBy: row.created_by ?? undefined, assignedTo: row.assigned_to ?? undefined,
    approvedBy: row.approved_by ?? undefined, approvedAt: row.approved_at ?? undefined,
    executedAt: row.executed_at ?? undefined, rolledBackAt: row.rolled_back_at ?? undefined,
    parentActionId: row.parent_action_id ?? undefined, metadata: row.metadata ?? {},
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const actionQueueService = {
  async enqueue(input: {
    organizationId: string;
    ruleId?: string;
    actionType: ActionType;
    title: string;
    description?: string;
    reason?: string;
    confidenceScore: number;
    dataUsed?: Record<string, unknown>;
    impact?: string;
    risk?: string;
    estimatedTimeSaved?: string;
    payload?: Record<string, unknown>;
    priority?: string;
    createdBy?: string;
    assignedTo?: string;
    parentActionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<QueuedAction> {
    const id = randomUUID();
    const { rows } = await query<ActionQueueRow>(
      `INSERT INTO action_queue (id, organization_id, rule_id, action_type, title, description, reason, confidence_score, data_used, impact, risk, estimated_time_saved, payload, priority, created_by, assigned_to, parent_action_id, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now(), now()) RETURNING *`,
      [id, input.organizationId, input.ruleId ?? null, input.actionType, input.title, input.description ?? null, input.reason ?? null, input.confidenceScore, JSON.stringify(input.dataUsed ?? {}), input.impact ?? null, input.risk ?? null, input.estimatedTimeSaved ?? null, JSON.stringify(input.payload ?? {}), input.priority ?? 'medium', input.createdBy ?? null, input.assignedTo ?? null, input.parentActionId ?? null, JSON.stringify(input.metadata ?? {})],
    );
    await audit({ organizationId: input.organizationId, actorId: input.createdBy ?? null, action: 'action_queue.enqueue', entity: 'action_queue', entityId: id, metadata: { actionType: input.actionType, title: input.title } });
    return mapRow(rows[0]);
  },

  async list(organizationId: string, filters: { status?: ActionStatus; priority?: string; actionType?: string; limit?: number; offset?: number } = {}): Promise<{ actions: QueuedAction[]; total: number }> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.priority) { conditions.push(`priority = $${i++}`); params.push(filters.priority); }
    if (filters.actionType) { conditions.push(`action_type = $${i++}`); params.push(filters.actionType); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const countResult = await query(`SELECT COUNT(*) FROM action_queue ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const { rows } = await query<ActionQueueRow>(`SELECT * FROM action_queue ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return { actions: rows.map(mapRow), total };
  },

  async findById(id: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(`SELECT * FROM action_queue WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async approve(id: string, organizationId: string, approverId: string, decision?: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'approved', approved_by = $1, approved_at = now(), updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [approverId, id, organizationId],
    );
    if (!rows[0]) return null;
    await audit({ organizationId, actorId: approverId, action: 'action_queue.approve', entity: 'action_queue', entityId: id, metadata: { decision } });
    return mapRow(rows[0]);
  },

  async reject(id: string, organizationId: string, approverId: string, reason?: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'rejected', approved_by = $1, approved_at = now(), updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [approverId, id, organizationId],
    );
    if (!rows[0]) return null;
    await audit({ organizationId, actorId: approverId, action: 'action_queue.reject', entity: 'action_queue', entityId: id, metadata: { reason } });
    return mapRow(rows[0]);
  },

  async markExecuting(id: string, organizationId: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'executing', updated_at = now() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async markCompleted(id: string, organizationId: string, executedBy?: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'completed', executed_at = now(), assigned_to = $3, updated_at = now() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId, executedBy ?? null],
    );
    if (!rows[0]) return null;
    await audit({ organizationId, actorId: executedBy ?? null, action: 'action_queue.complete', entity: 'action_queue', entityId: id });
    return mapRow(rows[0]);
  },

  async markFailed(id: string, organizationId: string, errorMessage?: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'failed', updated_at = now() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId],
    );
    if (!rows[0]) return null;
    await audit({ organizationId, actorId: null, action: 'action_queue.fail', entity: 'action_queue', entityId: id, metadata: { error: errorMessage ?? null } });
    return mapRow(rows[0]);
  },

  async rollback(id: string, organizationId: string, reason?: string): Promise<QueuedAction | null> {
    const { rows } = await query<ActionQueueRow>(
      `UPDATE action_queue SET status = 'rolled_back', rolled_back_at = now(), updated_at = now() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId],
    );
    if (!rows[0]) return null;
    await audit({ organizationId, actorId: null, action: 'action_queue.rollback', entity: 'action_queue', entityId: id, metadata: { reason } });
    return mapRow(rows[0]);
  },
};
