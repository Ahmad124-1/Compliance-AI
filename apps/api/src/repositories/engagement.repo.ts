import { query } from '../db/pool.js';
import type {
  EngagementDailyScore,
  EngagementAiInsight,
  EngagementAiInsightInput,
  EngagementDailySummary,
} from '../types/engagement.js';

function mapDailyScore(row: any): EngagementDailyScore {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    scoreDate: row.score_date,
    engagementScore: row.engagement_score,
    wellbeingScore: row.wellbeing_score,
    moraleScore: row.morale_score,
    communicationScore: row.communication_score,
    recognitionScore: row.recognition_score,
    trainingScore: row.training_score,
    overallScore: row.overall_score,
    dataSources: row.data_sources ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAiInsight(row: any): EngagementAiInsight {
  return {
    id: row.id,
    organizationId: row.organization_id,
    insightType: row.insight_type,
    severity: row.severity,
    title: row.title,
    description: row.description,
    recommendations: row.recommendations ?? [],
    affectedScope: row.affected_scope ?? {},
    data: row.data ?? {},
    isRead: row.is_read,
    isResolved: row.is_resolved,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDailySummary(row: any): EngagementDailySummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id,
    departmentId: row.department_id,
    summaryDate: row.summary_date,
    activeWorkers: parseInt(row.active_workers, 10),
    surveyResponses: parseInt(row.survey_responses, 10),
    avgEngagementScore: row.avg_engagement_score,
    avgWellbeingScore: row.avg_wellbeing_score,
    avgMoraleScore: row.avg_morale_score,
    recognitionCount: parseInt(row.recognition_count, 10),
    eventsHeld: parseInt(row.events_held, 10),
    eventAttendanceCount: parseInt(row.event_attendance_count, 10),
    aiInsightsCount: parseInt(row.ai_insights_count, 10),
    participationRate: row.participation_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const engagementRepo = {
  async findDailyScores(orgId: string, userId?: string, dateFrom?: string, dateTo?: string): Promise<EngagementDailyScore[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (userId) { conditions.push(`user_id = $${idx++}`); params.push(userId); }
    if (dateFrom) { conditions.push(`score_date >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`score_date <= $${idx++}`); params.push(dateTo); }
    const { rows } = await query(`SELECT * FROM engagement_daily_scores WHERE ${conditions.join(' AND ')} ORDER BY score_date DESC`, params);
    return rows.map(mapDailyScore);
  },

  async upsertDailyScore(orgId: string, userId: string, scoreDate: string, data: Partial<EngagementDailyScore>): Promise<EngagementDailyScore> {
    const { rows } = await query<EngagementDailyScore>(
      `INSERT INTO engagement_daily_scores (organization_id, user_id, score_date, engagement_score, wellbeing_score, morale_score, communication_score, recognition_score, training_score, overall_score, data_sources)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (organization_id, user_id, score_date) DO UPDATE SET
         engagement_score = COALESCE(EXCLUDED.engagement_score, engagement_daily_scores.engagement_score),
         wellbeing_score = COALESCE(EXCLUDED.wellbeing_score, engagement_daily_scores.wellbeing_score),
         morale_score = COALESCE(EXCLUDED.morale_score, engagement_daily_scores.morale_score),
         communication_score = COALESCE(EXCLUDED.communication_score, engagement_daily_scores.communication_score),
         recognition_score = COALESCE(EXCLUDED.recognition_score, engagement_daily_scores.recognition_score),
         training_score = COALESCE(EXCLUDED.training_score, engagement_daily_scores.training_score),
         overall_score = COALESCE(EXCLUDED.overall_score, engagement_daily_scores.overall_score),
         data_sources = COALESCE(EXCLUDED.data_sources, engagement_daily_scores.data_sources),
         updated_at = now()
       RETURNING *`,
      [
        orgId,
        userId,
        scoreDate,
        data.engagementScore ?? null,
        data.wellbeingScore ?? null,
        data.moraleScore ?? null,
        data.communicationScore ?? null,
        data.recognitionScore ?? null,
        data.trainingScore ?? null,
        data.overallScore ?? null,
        data.dataSources ?? {},
      ],
    );
    return mapDailyScore(rows[0]);
  },

  async findAiInsights(orgId: string, filters: { insightType?: string; severity?: string; isRead?: boolean; isResolved?: boolean } = {}): Promise<EngagementAiInsight[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.insightType) { conditions.push(`insight_type = $${idx++}`); params.push(filters.insightType); }
    if (filters.severity) { conditions.push(`severity = $${idx++}`); params.push(filters.severity); }
    if (filters.isRead !== undefined) { conditions.push(`is_read = $${idx++}`); params.push(filters.isRead); }
    if (filters.isResolved !== undefined) { conditions.push(`is_resolved = $${idx++}`); params.push(filters.isResolved); }
    const { rows } = await query(`SELECT * FROM engagement_ai_insights WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapAiInsight);
  },

  async createAiInsight(input: EngagementAiInsightInput): Promise<EngagementAiInsight> {
    const { rows } = await query<EngagementAiInsight>(
      `INSERT INTO engagement_ai_insights (organization_id, insight_type, severity, title, description, recommendations, affected_scope, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.insightType,
        input.severity ?? 'info',
        input.title,
        input.description,
        input.recommendations ?? [],
        input.affectedScope ?? {},
        input.data ?? {},
      ],
    );
    return mapAiInsight(rows[0]);
  },

  async resolveAiInsight(orgId: string, id: string): Promise<EngagementAiInsight | null> {
    const { rows } = await query<EngagementAiInsight>(
      `UPDATE engagement_ai_insights SET is_resolved = TRUE, resolved_at = now(), updated_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *`,
      [orgId, id],
    );
    return rows[0] ? mapAiInsight(rows[0]) : null;
  },

  async markAiInsightRead(orgId: string, id: string): Promise<EngagementAiInsight | null> {
    const { rows } = await query<EngagementAiInsight>(
      `UPDATE engagement_ai_insights SET is_read = TRUE, updated_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *`,
      [orgId, id],
    );
    return rows[0] ? mapAiInsight(rows[0]) : null;
  },

  async findDailySummary(orgId: string, dateFrom?: string, dateTo?: string, siteId?: string, departmentId?: string): Promise<EngagementDailySummary[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (dateFrom) { conditions.push(`summary_date >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`summary_date <= $${idx++}`); params.push(dateTo); }
    if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
    if (departmentId) { conditions.push(`department_id = $${idx++}`); params.push(departmentId); }
    const { rows } = await query(`SELECT * FROM engagement_daily_summary WHERE ${conditions.join(' AND ')} ORDER BY summary_date DESC`, params);
    return rows.map(mapDailySummary);
  },

  async upsertDailySummary(input: Partial<EngagementDailySummary> & { organizationId: string; summaryDate: string }): Promise<EngagementDailySummary> {
    const { rows } = await query<EngagementDailySummary>(
      `INSERT INTO engagement_daily_summary (organization_id, site_id, department_id, summary_date, active_workers, survey_responses, avg_engagement_score, avg_wellbeing_score, avg_morale_score, recognition_count, events_held, event_attendance_count, ai_insights_count, participation_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (organization_id, site_id, department_id, summary_date) DO UPDATE SET
         active_workers = EXCLUDED.active_workers,
         survey_responses = EXCLUDED.survey_responses,
         avg_engagement_score = COALESCE(EXCLUDED.avg_engagement_score, engagement_daily_summary.avg_engagement_score),
         avg_wellbeing_score = COALESCE(EXCLUDED.avg_wellbeing_score, engagement_daily_summary.avg_wellbeing_score),
         avg_morale_score = COALESCE(EXCLUDED.avg_morale_score, engagement_daily_summary.avg_morale_score),
         recognition_count = EXCLUDED.recognition_count,
         events_held = EXCLUDED.events_held,
         event_attendance_count = EXCLUDED.event_attendance_count,
         ai_insights_count = EXCLUDED.ai_insights_count,
         participation_rate = COALESCE(EXCLUDED.participation_rate, engagement_daily_summary.participation_rate),
         updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.summaryDate,
        input.activeWorkers ?? 0,
        input.surveyResponses ?? 0,
        input.avgEngagementScore ?? null,
        input.avgWellbeingScore ?? null,
        input.avgMoraleScore ?? null,
        input.recognitionCount ?? 0,
        input.eventsHeld ?? 0,
        input.eventAttendanceCount ?? 0,
        input.aiInsightsCount ?? 0,
        input.participationRate ?? null,
      ],
    );
    return mapDailySummary(rows[0]);
  },
};
