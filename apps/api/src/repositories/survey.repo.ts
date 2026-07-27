import { query } from '../db/pool.js';
import type { EngagementPulseSurvey, EngagementSurveyResponse } from '../types/engagement.js';

function mapSurvey(row: any): EngagementPulseSurvey {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    surveyType: row.survey_type,
    status: row.status,
    questions: row.questions ?? [],
    isAnonymous: row.is_anonymous,
    isRecurring: row.is_recurring,
    recurrenceInterval: row.recurrence_interval,
    targetAudience: row.target_audience ?? {},
    departmentId: row.department_id,
    siteId: row.site_id,
    language: row.language,
    scheduledAt: row.scheduled_at,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapResponse(row: any): EngagementSurveyResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    surveyId: row.survey_id,
    userId: row.user_id,
    answers: row.answers ?? {},
    overallScore: row.overall_score,
    sentiment: row.sentiment,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

export const surveyRepo = {
  async findById(orgId: string, id: string): Promise<EngagementPulseSurvey | null> {
    const { rows } = await query(`SELECT * FROM engagement_pulse_surveys WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapSurvey(rows[0]) : null;
  },

  async findMany(orgId: string, filters: { status?: string; departmentId?: string; siteId?: string } = {}): Promise<EngagementPulseSurvey[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.departmentId) { conditions.push(`department_id = $${idx++}`); params.push(filters.departmentId); }
    if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
    const { rows } = await query(`SELECT * FROM engagement_pulse_surveys WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapSurvey);
  },

  async create(input: Partial<EngagementPulseSurvey> & { organizationId: string; createdBy?: string | null }): Promise<EngagementPulseSurvey> {
    const { rows } = await query<EngagementPulseSurvey>(
      `INSERT INTO engagement_pulse_surveys (organization_id, title, description, survey_type, status, questions, is_anonymous, is_recurring, recurrence_interval, target_audience, department_id, site_id, language, scheduled_at, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        input.organizationId,
        input.title,
        input.description ?? null,
        input.surveyType ?? 'pulse',
        input.status ?? 'draft',
        input.questions ?? [],
        input.isAnonymous ?? true,
        input.isRecurring ?? false,
        input.recurrenceInterval ?? null,
        input.targetAudience ?? {},
        input.departmentId ?? null,
        input.siteId ?? null,
        input.language ?? 'en',
        input.scheduledAt ?? null,
        input.expiresAt ?? null,
        input.createdBy ?? null,
      ],
    );
    return mapSurvey(rows[0]);
  },

  async update(orgId: string, id: string, patch: Partial<EngagementPulseSurvey>): Promise<EngagementPulseSurvey | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title) set('title', patch.title);
    if (patch.description) set('description', patch.description);
    if (patch.status) set('status', patch.status);
    if (patch.questions) set('questions', patch.questions);
    if (patch.isAnonymous !== undefined) set('is_anonymous', patch.isAnonymous);
    if (patch.isRecurring !== undefined) set('is_recurring', patch.isRecurring);
    if (patch.recurrenceInterval !== undefined) set('recurrence_interval', patch.recurrenceInterval);
    if (patch.targetAudience) set('target_audience', patch.targetAudience);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.language) set('language', patch.language);
    if (patch.scheduledAt !== undefined) set('scheduled_at', patch.scheduledAt);
    if (patch.expiresAt !== undefined) set('expires_at', patch.expiresAt);
    if (!sets.length) return this.findById(orgId, id);
    sets.push(`updated_at = now()`);
    params.push(orgId, id);
    const { rows } = await query(`UPDATE engagement_pulse_surveys SET ${sets.join(', ')} WHERE organization_id = $${i - 1} AND id = $${i} RETURNING *`, params);
    return rows[0] ? mapSurvey(rows[0]) : null;
  },

  async findResponses(orgId: string, surveyId: string, filters: { userId?: string } = {}): Promise<EngagementSurveyResponse[]> {
    const conditions = ['organization_id = $1', 'survey_id = $2'];
    const params: unknown[] = [orgId, surveyId];
    if (filters.userId) { conditions.push(`user_id = $3`); params.push(filters.userId); }
    const { rows } = await query(`SELECT * FROM engagement_survey_responses WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapResponse);
  },

  async createResponse(input: { organizationId: string; surveyId: string; userId?: string | null; answers: Record<string, unknown>; overallScore?: number | null; sentiment?: string | null }): Promise<EngagementSurveyResponse> {
    const { rows } = await query<EngagementSurveyResponse>(
      `INSERT INTO engagement_survey_responses (organization_id, survey_id, user_id, answers, overall_score, sentiment, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *`,
      [input.organizationId, input.surveyId, input.userId ?? null, input.answers, input.overallScore ?? null, input.sentiment ?? null],
    );
    return mapResponse(rows[0]);
  },
};
