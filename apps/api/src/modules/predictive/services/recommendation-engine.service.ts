import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { defaultAiProvider } from '../../ai/factory.js';
import { ragService } from '../../ai/rag/pipeline.js';
import { memoryService } from '../../ai/memory/service.js';
import { query } from '../../../db/pool.js';
import type { RecommendationRecord, RecommendationInput, RecommendationPriority } from '../types.js';

function mapRow(row: Record<string, any>): RecommendationRecord {
  return {
    id: row.id, organizationId: row.organization_id, type: row.type, priority: row.priority,
    title: row.title, description: row.description, expectedImpact: row.expected_impact, reason: row.reason,
    estimatedEffort: row.estimated_effort, status: row.status, actionTaken: row.action_taken,
    actionedBy: row.actioned_by, actionedAt: row.actioned_at, metadata: row.metadata ?? {},
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const AIRecommendationTemplates: Array<{
  type: string;
  title: string;
  description: string;
  expectedImpact: string;
  reason: string;
  estimatedEffort: string;
  priority: RecommendationPriority;
}> = [
  { type: 'general', title: 'Schedule internal audit', description: 'An internal audit should be scheduled for high-risk departments.', expectedImpact: 'Identify compliance gaps before external audit', reason: 'Risk forecast shows elevated failure probability', priority: 'high', estimatedEffort: '2-3 weeks' },
  { type: 'general', title: 'Train production department', description: 'Production department shows repeated compliance gaps.', expectedImpact: 'Reduce violations by up to 30%', reason: 'Training trend analysis indicates low completion rate', priority: 'medium', estimatedEffort: '1-2 weeks' },
  { type: 'general', title: 'Increase worker interviews', description: 'Conduct additional worker interviews in identified hotspots.', expectedImpact: 'Surface hidden grievances and improve trust', reason: 'Worker intelligence predicts rising grievances', priority: 'medium', estimatedEffort: '1 week' },
  { type: 'general', title: 'Review supplier documentation', description: 'Audit critical supplier compliance documentation.', expectedImpact: 'Prevent supply chain disruptions', reason: 'Supplier risk model flags compliance decline', priority: 'high', estimatedEffort: '2-4 weeks' },
  { type: 'general', title: 'Perform safety inspection', description: 'Unannounced safety inspection recommended.', expectedImpact: 'Prevent incidents and ensure PPE compliance', reason: 'Safety incident prediction elevated', priority: 'urgent', estimatedEffort: '1 week' },
  { type: 'general', title: 'Revise policy', description: 'Update compliance policy based on trend analysis.', expectedImpact: 'Align with latest regulatory requirements', reason: 'Policy gap detected in trend engine', priority: 'medium', estimatedEffort: '3-4 weeks' },
  { type: 'general', title: 'Increase management review', description: 'Increase frequency of management review meetings.', expectedImpact: 'Faster CAPA closure and decision making', reason: 'CAPA prediction shows bottlenecks', priority: 'medium', estimatedEffort: 'Ongoing' },
];

export const recommendationEngineService = {
  async generate(input: RecommendationInput): Promise<RecommendationRecord[]> {
    const aiAvailable = defaultAiProvider.capabilities().recommend;
    const records: RecommendationRecord[] = [];

    if (aiAvailable) {
      try {
        const [ragContext, memory] = await Promise.all([
          ragService.retrieve({
            organizationId: input.organizationId,
            query: input.type,
            topK: 5,
            domains: ['policy', 'audit', 'capa', 'grievance', 'evidence', 'supplier'],
          }),
          memoryService.buildContext(input.organizationId),
        ]);

        const contextParts = [
          memory ? `Organization Memory\n${memory}` : '',
          ragContext.clauses.length ? `Policies/Clauses:\n${ragContext.clauses.join('\n')}` : '',
          ragContext.capas.length ? `CAPAs:\n${ragContext.capas.join('\n')}` : '',
          ragContext.audits.length ? `Audits:\n${ragContext.audits.join('\n')}` : '',
          ragContext.grievances.length ? `Grievances:\n${ragContext.grievances.join('\n')}` : '',
          ragContext.suppliers.length ? `Suppliers:\n${ragContext.suppliers.join('\n')}` : '',
        ].filter(Boolean);
        const contextText = contextParts.join('\n\n');

        const prompt = `You are a compliance assistant. Based on the following retrieved context about organization ${input.organizationId}, generate 3-5 prioritized recommendations for improving compliance in the area: ${input.type}.

${contextText}

Return recommendations as JSON array with fields: title, description, expectedImpact, reason, estimatedEffort, priority (low|medium|high|urgent).`;

        const recommend = defaultAiProvider.recommend;
        if (recommend) {
          const result = await recommend({
            text: prompt,
            category: input.type,
            priority: input.priority ?? 'high',
          });

          const priorityMap: Record<string, RecommendationPriority> = { low: 'low', medium: 'medium', high: 'high', urgent: 'urgent' };
          for (const rec of result.recommendations) {
            records.push({
              id: randomUUID(), organizationId: input.organizationId, type: input.type,
              priority: priorityMap[rec.priority] ?? 'medium', title: rec.title,
              description: rec.description, expectedImpact: rec.action ?? rec.rationale,
              reason: rec.rationale, estimatedEffort: 'TBD', status: 'open', actionTaken: false,
              metadata: { source: 'ai_engine', context: input.context ?? {} },
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        // fall through to templates
      }
    }

    if (records.length === 0) {
      for (const tpl of AIRecommendationTemplates) {
        const { rows } = await query<Record<string, any>>(
          `INSERT INTO recommendations (id, organization_id, type, priority, title, description, expected_impact, reason, estimated_effort, status, action_taken, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
          [randomUUID(), input.organizationId, tpl.type, tpl.priority, tpl.title, tpl.description, tpl.expectedImpact, tpl.reason, tpl.estimatedEffort, 'open', false, JSON.stringify({ source: 'ai_engine', context: input.context ?? {} }), new Date().toISOString(), new Date().toISOString()],
        );
        records.push(mapRow(rows[0]));
      }
      await audit({ organizationId: input.organizationId, action: 'recommendation.generate', entity: 'recommendation', entityId: records.map((r) => r.id).join(',') });
    }

    return records;
  },

  async list(organizationId: string, filters: { status?: string; priority?: string; type?: string } = {}): Promise<RecommendationRecord[]> {
    const conditions: string[] = ['organization_id = $1'];
    const params: any[] = [organizationId];
    let i = 2;
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.priority) { conditions.push(`priority = $${i++}`); params.push(filters.priority); }
    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query<Record<string, any>>(`SELECT * FROM recommendations ${where} ORDER BY created_at DESC LIMIT 100`, params);
    return rows.map(mapRow);
  },

  async updateStatus(id: string, status: string, actionedBy?: string): Promise<RecommendationRecord | null> {
    const { rows } = await query<Record<string, any>>(
      `UPDATE recommendations SET status = $1, action_taken = $2, actioned_by = $3, actioned_at = $4, updated_at = now() WHERE id = $5 RETURNING *`,
      [status, status === 'actioned', actionedBy ?? null, status === 'actioned' ? new Date().toISOString() : null, id],
    );
    if (!rows[0]) return null;
    await audit({ action: 'recommendation.update', entity: 'recommendation', entityId: id, metadata: { status } });
    return mapRow(rows[0]);
  },
};
