import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import type { PredictionRecord, RiskLevel, PredictionType, PredictionCategory } from '../types.js';

interface PredictionRow {
  id: string;
  organizationId: string;
  type: string;
  category: string;
  entityType: string;
  entityId: string | null;
  title: string;
  description: string | null;
  probability: string;
  confidenceScore: string;
  reasoning: string | null;
  suggestedActions: string[];
  riskLevel: string;
  timeframe: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: PredictionRow): PredictionRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    type: row.type as PredictionType,
    category: row.category as PredictionCategory,
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    probability: parseFloat(row.probability),
    confidenceScore: parseFloat(row.confidenceScore),
    reasoning: row.reasoning ?? undefined,
    suggestedActions: row.suggestedActions,
    riskLevel: row.riskLevel as RiskLevel,
    timeframe: row.timeframe ?? undefined,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const predictionService = {
  async create(input: {
    organizationId: string;
    type: PredictionType;
    category: PredictionCategory;
    entityType: string;
    entityId?: string;
    title: string;
    description?: string;
    probability: number;
    confidenceScore: number;
    reasoning?: string;
    suggestedActions?: string[];
    riskLevel?: RiskLevel;
    timeframe?: string;
    metadata?: Record<string, unknown>;
  }, actorId?: string | null): Promise<PredictionRecord> {
    const record = {
      id: randomUUID(),
      organizationId: input.organizationId,
      type: input.type,
      category: input.category,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      title: input.title,
      description: input.description ?? null,
      probability: Math.max(0, Math.min(100, input.probability)),
      confidenceScore: Math.max(0, Math.min(100, input.confidenceScore)),
      reasoning: input.reasoning ?? null,
      suggested_actions: input.suggestedActions ?? [],
      risk_level: input.riskLevel ?? 'medium',
      timeframe: input.timeframe ?? null,
      metadata: input.metadata ?? {},
    };
    const { rows } = await query<PredictionRow>(
      `INSERT INTO predictions (id, organization_id, type, category, entity_type, entity_id, title, description, probability, confidence_score, reasoning, suggested_actions, risk_level, timeframe, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [record.id, record.organizationId, record.type, record.category, record.entityType, record.entityId, record.title, record.description, record.probability, record.confidenceScore, record.reasoning, JSON.stringify(record.suggested_actions), record.risk_level, record.timeframe, JSON.stringify(record.metadata)],
    );
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'prediction.create', entity: 'prediction', entityId: record.id, metadata: { type: input.type, category: input.category } });
    return mapRow(rows[0]);
  },

  async list(organizationId: string, filters: { type?: string; category?: string; riskLevel?: string; limit?: number; offset?: number } = {}): Promise<{ predictions: PredictionRecord[]; total: number }> {
    const conditions: string[] = ['organization_id = $1'];
    const params: any[] = [organizationId];
    let i = 2;
    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    if (filters.category) { conditions.push(`category = $${i++}`); params.push(filters.category); }
    if (filters.riskLevel) { conditions.push(`risk_level = $${i++}`); params.push(filters.riskLevel); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const countResult = await query(`SELECT COUNT(*) FROM predictions ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const { rows } = await query<PredictionRow>(`SELECT * FROM predictions ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return { predictions: rows.map(mapRow), total };
  },

  async findById(id: string): Promise<PredictionRecord | null> {
    const { rows } = await query<PredictionRow>(`SELECT * FROM predictions WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async getStats(organizationId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byRiskLevel: Record<string, number>;
    avgProbability: number;
    avgConfidence: number;
  }> {
    const { rows } = await query<{ type: string; risk_level: string; count: string; avg_prob: string | null; avg_conf: string | null }>(
      `SELECT type, risk_level, COUNT(*) as count, AVG(probability) as avg_prob, AVG(confidence_score) as avg_conf FROM predictions WHERE organization_id = $1 GROUP BY type, risk_level`,
      [organizationId],
    );
    const stats = {
      total: 0,
      byType: {} as Record<string, number>,
      byRiskLevel: {} as Record<string, number>,
      avgProbability: 0,
      avgConfidence: 0,
    };
    let probSum = 0;
    let confSum = 0;
    for (const r of rows) {
      const count = parseInt(r.count, 10);
      stats.total += count;
      stats.byType[r.type] = (stats.byType[r.type] ?? 0) + count;
      stats.byRiskLevel[r.risk_level] = (stats.byRiskLevel[r.risk_level] ?? 0) + count;
      probSum += parseFloat(r.avg_prob ?? '0') * count;
      confSum += parseFloat(r.avg_conf ?? '0') * count;
    }
    if (stats.total > 0) {
      stats.avgProbability = probSum / stats.total;
      stats.avgConfidence = confSum / stats.total;
    }
    return stats;
  },
};

