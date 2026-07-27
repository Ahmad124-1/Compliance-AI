import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import { actionQueueService } from './action-queue.service.js';
import type { ExecutionLog, ExecutionStatus } from '../types.js';

interface ExecutionLogRow {
  id: string;
  organization_id: string;
  action_id: string;
  status: string;
  result: Record<string, unknown>;
  error_message: string | null;
  execution_time_ms: number | null;
  executed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function mapRow(row: ExecutionLogRow): ExecutionLog {
  return {
    id: row.id, organizationId: row.organization_id, actionId: row.action_id,
    status: row.status as ExecutionStatus, result: row.result ?? {},
    errorMessage: row.error_message ?? undefined, executionTimeMs: row.execution_time_ms ?? undefined,
    executedBy: row.executed_by ?? undefined, metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export const executionEngineService = {
  async execute(actionId: string, organizationId: string, executedBy?: string): Promise<ExecutionLog> {
    const action = await actionQueueService.findById(actionId);
    if (!action) throw new Error('Action not found');
    if (action.status !== 'approved') throw new Error('Action is not approved for execution');

    await actionQueueService.markExecuting(actionId, organizationId);

    const startTime = Date.now();
    let result: Record<string, unknown> = {};
    let status: ExecutionStatus = 'success';
    let errorMessage: string | undefined;

    try {
      result = await this.runAction(action);
    } catch (err) {
      status = 'failure';
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await actionQueueService.markFailed(actionId, organizationId, errorMessage);
    }

    const executionTimeMs = Date.now() - startTime;
    if (status === 'success') {
      await actionQueueService.markCompleted(actionId, organizationId, executedBy);
    }

    const id = randomUUID();
    const { rows } = await query<ExecutionLogRow>(
      `INSERT INTO execution_logs (id, organization_id, action_id, status, result, error_message, execution_time_ms, executed_by, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) RETURNING *`,
      [id, organizationId, actionId, status, JSON.stringify(result), errorMessage ?? null, executionTimeMs, executedBy ?? null, JSON.stringify({ actionType: action.actionType })],
    );
    await audit({ organizationId, actorId: executedBy ?? null, action: 'execution.execute', entity: 'execution_log', entityId: id, metadata: { actionId, status, executionTimeMs } });
    return mapRow(rows[0]);
  },

  async runAction(action: { actionType: string; payload: Record<string, unknown> }): Promise<Record<string, unknown>> {
    switch (action.actionType) {
      case 'capa_create':
        return this.createCAPA(action.payload);
      case 'audit_plan':
        return this.generateAuditPlan(action.payload);
      case 'policy_update':
        return this.updatePolicy(action.payload);
      case 'training_assign':
        return this.assignTraining(action.payload);
      case 'supplier_audit':
        return this.scheduleSupplierAudit(action.payload);
      case 'notification_send':
        return this.sendNotification(action.payload);
      case 'escalation':
        return this.escalate(action.payload);
      case 'evidence_request':
        return this.requestEvidence(action.payload);
      default:
        return { message: 'Custom action executed', actionType: action.actionType };
    }
  },

  async createCAPA(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'CAPA draft created', capaId: randomUUID(), status: 'draft' };
  },

  async generateAuditPlan(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Audit plan generated', planId: randomUUID(), status: 'draft' };
  },

  async updatePolicy(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Policy update drafted', policyUpdateId: randomUUID(), status: 'draft' };
  },

  async assignTraining(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Training assigned', trainingId: randomUUID(), status: 'assigned' };
  },

  async scheduleSupplierAudit(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Supplier audit scheduled', auditId: randomUUID(), status: 'scheduled' };
  },

  async sendNotification(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Notification sent', notificationId: randomUUID(), status: 'sent' };
  },

  async escalate(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Escalation created', escalationId: randomUUID(), status: 'escalated' };
  },

  async requestEvidence(_payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { message: 'Evidence request sent', requestId: randomUUID(), status: 'pending' };
  },

  async getExecutionLogs(organizationId: string, filters: { actionId?: string; status?: ExecutionStatus; limit?: number; offset?: number } = {}): Promise<{ logs: ExecutionLog[]; total: number }> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.actionId) { conditions.push(`action_id = $${i++}`); params.push(filters.actionId); }
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const countResult = await query(`SELECT COUNT(*) FROM execution_logs ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const { rows } = await query<ExecutionLogRow>(`SELECT * FROM execution_logs ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return { logs: rows.map(mapRow), total };
  },
};
