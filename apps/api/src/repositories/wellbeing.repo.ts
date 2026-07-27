import { query } from '../db/pool.js';
import type { EngagementWellbeingAssessment } from '../types/engagement.js';

function mapAssessment(row: any): EngagementWellbeingAssessment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    assessmentType: row.assessment_type,
    scores: row.scores ?? {},
    indicators: row.indicators ?? [],
    tips: row.tips ?? [],
    overallWellbeingScore: row.overall_wellbeing_score,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

export const wellbeingRepo = {
  async findAssessments(orgId: string, userId: string, assessmentType?: string, dateFrom?: string, dateTo?: string): Promise<EngagementWellbeingAssessment[]> {
    const conditions = ['organization_id = $1', 'user_id = $2'];
    const params: unknown[] = [orgId, userId];
    let idx = 3;
    if (assessmentType) { conditions.push(`assessment_type = $${idx++}`); params.push(assessmentType); }
    if (dateFrom) { conditions.push(`created_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`created_at <= $${idx++}`); params.push(dateTo); }
    const { rows } = await query(`SELECT * FROM engagement_wellbeing_assessments WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapAssessment);
  },

  async create(input: { organizationId: string; userId: string; assessmentType: string; scores: Record<string, unknown>; indicators?: any[]; tips?: any[]; overallWellbeingScore?: number | null }): Promise<EngagementWellbeingAssessment> {
    const { rows } = await query<EngagementWellbeingAssessment>(
      `INSERT INTO engagement_wellbeing_assessments (organization_id, user_id, assessment_type, scores, indicators, tips, overall_wellbeing_score, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now()) RETURNING *`,
      [input.organizationId, input.userId, input.assessmentType, input.scores, input.indicators ?? [], input.tips ?? [], input.overallWellbeingScore ?? null],
    );
    return mapAssessment(rows[0]);
  },

  async findTips(orgId: string, topic?: string): Promise<any[]> {
    if (topic) {
      const { rows } = await query(`SELECT * FROM engagement_ai_insights WHERE organization_id = $1 AND insight_type = 'wellbeing_tips' AND data->>'topic' = $2 ORDER BY created_at DESC LIMIT 20`, [orgId, topic]);
      return rows.map((r: any) => ({ id: r.id, topic: r.data?.topic, text: r.description, recommendations: r.recommendations }));
    }
    const { rows } = await query(`SELECT * FROM engagement_ai_insights WHERE organization_id = $1 AND insight_type = 'wellbeing_tips' ORDER BY created_at DESC LIMIT 20`, [orgId]);
    return rows.map((r: any) => ({ id: r.id, topic: r.data?.topic || 'general', text: r.description, recommendations: r.recommendations }));
  },
};
