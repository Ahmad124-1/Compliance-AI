import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import { actionQueueService } from './action-queue.service.js';
import type { Approval, ApprovalStatus } from '../types.js';

interface ApprovalRow {
  id: string;
  organization_id: string;
  action_id: string;
  status: string;
  decision: string | null;
  comments: string | null;
  approver_id: string;
  decided_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ApprovalRow): Approval {
  return {
    id: row.id, organizationId: row.organization_id, actionId: row.action_id,
    status: row.status as ApprovalStatus, decision: row.decision ?? undefined,
    comments: row.comments ?? undefined, approverId: row.approver_id,
    decidedAt: row.decided_at ?? undefined, metadata: row.metadata ?? {},
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const approvalEngineService = {
  async approveAction(actionId: string, organizationId: string, approverId: string, decision?: string, comments?: string): Promise<Approval> {
    const action = await actionQueueService.findById(actionId);
    if (!action) throw new Error('Action not found');
    if (action.status !== 'pending') throw new Error('Action is not pending approval');

    await actionQueueService.approve(actionId, organizationId, approverId, decision);

    const id = randomUUID();
    const { rows } = await query<ApprovalRow>(
      `INSERT INTO approvals (id, organization_id, action_id, status, decision, comments, approver_id, decided_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, 'approved', $4, $5, $6, now(), $7, now(), now()) RETURNING *`,
      [id, organizationId, actionId, decision ?? null, comments ?? null, approverId, JSON.stringify({ actionType: action.actionType })],
    );
    await audit({ organizationId, actorId: approverId, action: 'approval.approve', entity: 'approval', entityId: id, metadata: { actionId, decision } });
    return mapRow(rows[0]);
  },

  async rejectAction(actionId: string, organizationId: string, approverId: string, reason?: string): Promise<Approval> {
    const action = await actionQueueService.findById(actionId);
    if (!action) throw new Error('Action not found');
    if (action.status !== 'pending') throw new Error('Action is not pending approval');

    await actionQueueService.reject(actionId, organizationId, approverId, reason);

    const id = randomUUID();
    const { rows } = await query<ApprovalRow>(
      `INSERT INTO approvals (id, organization_id, action_id, status, decision, comments, approver_id, decided_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, 'rejected', 'rejected', $4, $5, now(), $6, now(), now()) RETURNING *`,
      [id, organizationId, actionId, reason ?? null, approverId, JSON.stringify({ actionType: action.actionType, reason })],
    );
    await audit({ organizationId, actorId: approverId, action: 'approval.reject', entity: 'approval', entityId: id, metadata: { actionId, reason } });
    return mapRow(rows[0]);
  },

  async modifyAction(actionId: string, organizationId: string, approverId: string, modifications: Record<string, unknown>, comments?: string): Promise<Approval> {
    await actionQueueService.reject(actionId, organizationId, approverId, 'Modified and resubmitted');

    const id = randomUUID();
    const { rows } = await query<ApprovalRow>(
      `INSERT INTO approvals (id, organization_id, action_id, status, decision, comments, approver_id, decided_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, 'modified', 'modified', $4, $5, now(), $6, now(), now()) RETURNING *`,
      [id, organizationId, actionId, comments ?? null, approverId, JSON.stringify({ actionType: 'modified', modifications, comments })],
    );
    await audit({ organizationId, actorId: approverId, action: 'approval.modify', entity: 'approval', entityId: id, metadata: { actionId, modifications } });
    return mapRow(rows[0]);
  },

  async getApprovals(organizationId: string, filters: { actionId?: string; status?: ApprovalStatus; approverId?: string } = {}): Promise<Approval[]> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.actionId) { conditions.push(`action_id = $${i++}`); params.push(filters.actionId); }
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.approverId) { conditions.push(`approver_id = $${i++}`); params.push(filters.approverId); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query<ApprovalRow>(`SELECT * FROM approvals ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapRow);
  },
};
