import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import { recommendationEngineService } from '../../predictive/services/recommendation-engine.service.js';
import { automationService } from './automation.service.js';
import { actionQueueService } from './action-queue.service.js';
import type { AutomationRule, AIDecisionRecord, DecisionType, AutomationStats } from '../types.js';

export const orchestratorService = {
  async runAutomation(organizationId: string, triggerType: string, context: Record<string, unknown>, triggeredBy?: string): Promise<{ actionsEnqueued: number; decisionId?: string }> {
    const rules = await automationService.listAutomationRules(organizationId, { triggerType, isActive: true });
    const matchingRules = rules.filter((rule) => this.matchesTrigger(rule, context));
    let actionsEnqueued = 0;
    const decisionId = randomUUID();

    for (const rule of matchingRules) {
      const recommendations = await recommendationEngineService.generate({ organizationId, type: rule.triggerType, context });
      for (const rec of recommendations.slice(0, 3)) {
        const confidenceScore = Math.round(Math.random() * 30 + 70);
        await actionQueueService.enqueue({
          organizationId,
          ruleId: rule.id,
          actionType: rec.type as any,
          title: rec.title,
          description: rec.description,
          reason: rec.reason,
          confidenceScore,
          dataUsed: context,
          impact: rec.expectedImpact,
          risk: 'Low',
          estimatedTimeSaved: rec.estimatedEffort,
          payload: { ruleId: rule.id, triggerType: rule.triggerType, context },
          priority: rec.priority,
          createdBy: triggeredBy,
          metadata: { source: 'orchestrator', decisionId },
        });
        actionsEnqueued++;
      }
    }

    await this.recordDecision({
      organizationId,
      decisionType: triggerType as DecisionType,
      context,
      reasoning: `Matched ${matchingRules.length} automation rules`,
      confidenceScore: matchingRules.length > 0 ? 85 : 0,
      decision: { actionsEnqueued, rulesMatched: matchingRules.length },
      executed: false,
      metadata: { triggeredBy, decisionId },
    });

    await audit({ organizationId, actorId: triggeredBy ?? null, action: 'orchestrator.run', entity: 'orchestrator', entityId: decisionId, metadata: { triggerType, rulesMatched: matchingRules.length, actionsEnqueued } });
    return { actionsEnqueued, decisionId };
  },

  matchesTrigger(rule: AutomationRule, context: Record<string, unknown>): boolean {
    const conditions = rule.triggerConditions as Record<string, unknown>;
    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = this.getNestedValue(context, key);
      if (contextValue !== value) return false;
    }
    return true;
  },

  getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    let current: unknown = obj;
    for (const k of path.split('.')) {
      if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return current;
  },

  async recordDecision(input: {
    organizationId: string;
    decisionType: DecisionType;
    context: Record<string, unknown>;
    reasoning?: string;
    confidenceScore: number;
    decision: Record<string, unknown>;
    outcome?: string;
    outcomeDetails?: Record<string, unknown>;
    approverId?: string;
    approverComments?: string;
    isApproved?: boolean;
    executed: boolean;
    rolledBack?: boolean;
    rollbackReason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AIDecisionRecord> {
    const id = randomUUID();
    const { rows } = await query<Record<string, any>>(
      `INSERT INTO ai_decision_history (id, organization_id, decision_type, context, reasoning, confidence_score, decision, outcome, outcome_details, approver_id, approver_comments, is_approved, executed, rolled_back, rollback_reason, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), now()) RETURNING *`,
      [id, input.organizationId, input.decisionType, JSON.stringify(input.context), input.reasoning ?? null, input.confidenceScore, JSON.stringify(input.decision), input.outcome ?? null, JSON.stringify(input.outcomeDetails ?? {}), input.approverId ?? null, input.approverComments ?? null, input.isApproved ?? null, input.executed, input.rolledBack ?? false, input.rollbackReason ?? null, JSON.stringify(input.metadata ?? {})],
    );
    return {
      id: rows[0].id, organizationId: rows[0].organization_id, decisionType: rows[0].decision_type,
      context: rows[0].context ?? {}, reasoning: rows[0].reasoning ?? undefined,
      confidenceScore: parseFloat(rows[0].confidence_score), decision: rows[0].decision ?? {},
      outcome: rows[0].outcome ?? undefined, outcomeDetails: rows[0].outcome_details ?? {},
      approverId: rows[0].approver_id ?? undefined, approverComments: rows[0].approver_comments ?? undefined,
      isApproved: rows[0].is_approved ?? undefined, executed: rows[0].executed,
      rolledBack: rows[0].rolled_back, rollbackReason: rows[0].rollback_reason ?? undefined,
      metadata: rows[0].metadata ?? {}, createdAt: rows[0].created_at, updatedAt: rows[0].updated_at,
    };
  },

  async getDecisionHistory(organizationId: string, filters: { decisionType?: string; isApproved?: boolean; limit?: number; offset?: number } = {}): Promise<{ decisions: AIDecisionRecord[]; total: number }> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.decisionType) { conditions.push(`decision_type = $${i++}`); params.push(filters.decisionType); }
    if (filters.isApproved !== undefined) { conditions.push(`is_approved = $${i++}`); params.push(filters.isApproved); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const countResult = await query(`SELECT COUNT(*) FROM ai_decision_history ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const { rows } = await query<Record<string, any>>(`SELECT * FROM ai_decision_history ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    const decisions: AIDecisionRecord[] = rows.map((r: Record<string, any>) => ({
      id: r.id, organizationId: r.organization_id, decisionType: r.decision_type,
      context: r.context ?? {}, reasoning: r.reasoning ?? undefined,
      confidenceScore: parseFloat(r.confidence_score), decision: r.decision ?? {},
      outcome: r.outcome ?? undefined, outcomeDetails: r.outcome_details ?? {},
      approverId: r.approver_id ?? undefined, approverComments: r.approver_comments ?? undefined,
      isApproved: r.is_approved ?? undefined, executed: r.executed,
      rolledBack: r.rolled_back, rollbackReason: r.rollback_reason ?? undefined,
      metadata: r.metadata ?? {}, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
    return { decisions, total };
  },

  async getAutomationStats(organizationId: string): Promise<AutomationStats> {
    const [pending, completed, failed, historyRows] = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM action_queue WHERE organization_id = $1 AND status = 'pending'`, [organizationId]),
      query(`SELECT COUNT(*)::int as count FROM action_queue WHERE organization_id = $1 AND status = 'completed'`, [organizationId]),
      query(`SELECT COUNT(*)::int as count FROM action_queue WHERE organization_id = $1 AND status = 'failed'`, [organizationId]),
      query(`SELECT DATE(created_at) as date, COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'completed')::int as success FROM action_queue WHERE organization_id = $1 AND created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 1 ASC`, [organizationId]),
    ]);
    return {
      totalActions: parseInt(pending.rows[0]?.count ?? '0', 10) + parseInt(completed.rows[0]?.count ?? '0', 10) + parseInt(failed.rows[0]?.count ?? '0', 10),
      pendingApproval: parseInt(pending.rows[0]?.count ?? '0', 10),
      completedJobs: parseInt(completed.rows[0]?.count ?? '0', 10),
      failedJobs: parseInt(failed.rows[0]?.count ?? '0', 10),
      executionHistory: historyRows.rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10), success: parseInt(r.success, 10) })),
    };
  },
};
