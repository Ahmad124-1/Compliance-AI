// Assessment runtime repository — instances, responses, scores, workflow.

import { query } from '../../../db/pool.js';
import {
  mapAssessment, mapScore, mapResponse, mapAssignment, mapReview, mapApproval, mapComment, mapAttachment, mapSchedulePlaceholder, mapTemplate,
} from './assessment.mappers.js';
import type {
  Assessment, AssessmentScore, AssessmentResponse, AssessmentAssignment,
  AssessmentComment, AssessmentAttachment, AssessmentSchedulePlaceholder,
  AssessmentTemplateFilters, Paginated, AssessmentLibraryItem,
} from '../types.js';

export const assessmentRepo = {
  // ---- Instances ----------------------------------------------------------
  async create(organizationId: string, input: Partial<Assessment> & { templateId: string; title: string; type: string }): Promise<Assessment> {
    const { rows } = await query<Assessment & any>(
      `INSERT INTO assessments
        (organization_id, template_id, template_version, code, title, type, category_id, status, scope,
         site_id, department_id, team_id, assignee_id, created_by, scheduled_start_date, scheduled_end_date,
         due_date, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        organizationId, input.templateId, input.templateVersion, input.code ?? null, input.title, input.type, input.categoryId ?? null,
        input.scope ?? 'organization', input.siteId ?? null, input.departmentId ?? null, input.teamId ?? null, input.assigneeId ?? null,
        input.createdBy ?? null, input.scheduledStartDate ?? null, input.scheduledEndDate ?? null, input.dueDate ?? null,
        JSON.stringify(input.tags ?? []), JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapAssessment(rows[0]);
  },

  async findById(id: string, organizationId?: string): Promise<Assessment | null> {
    const params: unknown[] = [id];
    let sql = `SELECT * FROM assessments WHERE id = $1`;
    if (organizationId) { params.push(organizationId); sql += ' AND organization_id = $2'; }
    const { rows } = await query(sql, params);
    return rows[0] ? mapAssessment(rows[0]) : null;
  },

  async list(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<Assessment>> {
    const where: string[] = ['a.organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.search) { where.push(`(a.title ILIKE $${i} OR a.code ILIKE $${i})`); params.push(`%${filters.search}%`); i++; }
    if (filters.type) { where.push(`a.type = $${i++}`); params.push(filters.type); }
    if (filters.status) { where.push(`a.status = $${i++}`); params.push(filters.status); }
    if (filters.categoryId) { where.push(`a.category_id = $${i++}`); params.push(filters.categoryId); }
    const sortCol = filters.sort === 'title' ? 'a.title' : 'a.updated_at';
    const dir = filters.order === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 20));
    const { rows: countRows } = await query<{ total: string }>(`SELECT COUNT(*) AS total FROM assessments a WHERE ${where.join(' AND ')}`, params);
    const total = parseInt(countRows[0]?.total ?? '0', 10);
    const { rows } = await query<Assessment & any>(
      `SELECT a.* FROM assessments a WHERE ${where.join(' AND ')} ORDER BY ${sortCol} ${dir} LIMIT $${i++} OFFSET $${i++}`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { data: rows.map(mapAssessment), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async update(id: string, organizationId: string, patch: Partial<Assessment>): Promise<Assessment | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.categoryId !== undefined) set('category_id', patch.categoryId);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.scope !== undefined) set('scope', patch.scope);
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.teamId !== undefined) set('team_id', patch.teamId);
    if (patch.assigneeId !== undefined) set('assignee_id', patch.assigneeId);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.scheduledStartDate !== undefined) set('scheduled_start_date', patch.scheduledStartDate);
    if (patch.scheduledEndDate !== undefined) set('scheduled_end_date', patch.scheduledEndDate);
    if (patch.progress !== undefined) set('progress', patch.progress);
    if (patch.scoringSummary !== undefined) set('scoring_summary', JSON.stringify(patch.scoringSummary));
    if (patch.tags !== undefined) set('tags', JSON.stringify(patch.tags));
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id, organizationId);
    params.push(id, organizationId);
    const { rows } = await query(`UPDATE assessments SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} RETURNING *`, params);
    return rows[0] ? mapAssessment(rows[0]) : null;
  },

  async remove(id: string, organizationId: string): Promise<void> {
    await query(`DELETE FROM assessments WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
  },

  // ---- Responses ----------------------------------------------------------
  async upsertResponse(input: {
    assessmentId: string; questionId: string; sectionId?: string | null; respondentId?: string | null;
    answerText?: string | null; answerNumber?: number | null; answerJson?: Record<string, unknown>;
    selectedOptionIds?: string[] | null; selectedValues?: string[] | null; isSkipped?: boolean;
    isFlagged?: boolean; confidence?: number | null; validationStatus?: string; validationMessages?: string[];
  }): Promise<AssessmentResponse> {
    const { rows } = await query<AssessmentResponse & any>(
      `INSERT INTO assessment_responses
        (assessment_id, question_id, section_id, respondent_id, answer_text, answer_number, answer_json,
         selected_option_ids, selected_values, is_skipped, is_flagged, confidence, validation_status, validation_messages, answered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())
       ON CONFLICT (assessment_id, question_id) DO UPDATE SET
         section_id = EXCLUDED.section_id, respondent_id = EXCLUDED.respondent_id, answer_text = EXCLUDED.answer_text,
         answer_number = EXCLUDED.answer_number, answer_json = EXCLUDED.answer_json, selected_option_ids = EXCLUDED.selected_option_ids,
         selected_values = EXCLUDED.selected_values, is_skipped = EXCLUDED.is_skipped, is_flagged = EXCLUDED.is_flagged,
         confidence = EXCLUDED.confidence, validation_status = EXCLUDED.validation_status, validation_messages = EXCLUDED.validation_messages,
         answered_at = now(), updated_at = now()
       RETURNING *`,
      [
        input.assessmentId, input.questionId, input.sectionId ?? null, input.respondentId ?? null, input.answerText ?? null,
        input.answerNumber ?? null, JSON.stringify(input.answerJson ?? {}), input.selectedOptionIds ?? null,
        input.selectedValues ?? null, input.isSkipped ?? false, input.isFlagged ?? false, input.confidence ?? null,
        input.validationStatus ?? 'pending', JSON.stringify(input.validationMessages ?? []),
      ],
    );
    return mapResponse(rows[0]);
  },

  async listResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    const { rows } = await query(`SELECT * FROM assessment_responses WHERE assessment_id = $1 ORDER BY question_id`, [assessmentId]);
    return rows.map(mapResponse);
  },

  // ---- Scores -------------------------------------------------------------
  async upsertScore(input: {
    assessmentId: string; questionId?: string | null; sectionId?: string | null; method: string;
    rawValue?: number | null; normalizedScore?: number | null; weightedScore?: number | null;
    maxScore?: number | null; label?: string | null; passed?: boolean | null; details?: Record<string, unknown>;
  }): Promise<AssessmentScore> {
    const { rows } = await query<AssessmentScore & any>(
      `INSERT INTO assessment_scores
        (assessment_id, question_id, section_id, method, raw_value, normalized_score, weighted_score, max_score, label, passed, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (assessment_id, question_id, section_id, method) DO UPDATE SET
         raw_value = EXCLUDED.raw_value, normalized_score = EXCLUDED.normalized_score, weighted_score = EXCLUDED.weighted_score,
         max_score = EXCLUDED.max_score, label = EXCLUDED.label, passed = EXCLUDED.passed, details = EXCLUDED.details, updated_at = now()
       RETURNING *`,
      [
        input.assessmentId, input.questionId ?? null, input.sectionId ?? null, input.method, input.rawValue ?? null,
        input.normalizedScore ?? null, input.weightedScore ?? null, input.maxScore ?? null, input.label ?? null,
        input.passed ?? null, JSON.stringify(input.details ?? {}),
      ],
    );
    return mapScore(rows[0]);
  },

  async listScores(assessmentId: string): Promise<AssessmentScore[]> {
    const { rows } = await query(`SELECT * FROM assessment_scores WHERE assessment_id = $1`, [assessmentId]);
    return rows.map(mapScore);
  },

  // ---- Assignments --------------------------------------------------------
  async createAssignment(input: {
    organizationId: string; assessmentId: string; assigneeId?: string | null; assigneeRole?: string | null;
    assignedBy?: string | null; status?: string; scope?: string; targetId?: string | null; dueDate?: Date | null; instructions?: string | null;
  }): Promise<AssessmentAssignment> {
    const { rows } = await query(
      `INSERT INTO assessment_assignments (organization_id, assessment_id, assignee_id, assignee_role, assigned_by, status, scope, target_id, due_date, instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [input.organizationId, input.assessmentId, input.assigneeId ?? null, input.assigneeRole ?? null, input.assignedBy ?? null,
        input.status ?? 'assigned', input.scope ?? 'assessment', input.targetId ?? null, input.dueDate ?? null, input.instructions ?? null],
    );
    return mapAssignment(rows[0]);
  },
  async listAssignments(assessmentId: string): Promise<AssessmentAssignment[]> {
    const { rows } = await query(`SELECT * FROM assessment_assignments WHERE assessment_id = $1 ORDER BY created_at`, [assessmentId]);
    return rows.map(mapAssignment);
  },
  async updateAssignment(id: string, patch: Partial<AssessmentAssignment>): Promise<AssessmentAssignment | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.assigneeId !== undefined) set('assignee_id', patch.assigneeId);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.acceptedAt !== undefined) set('accepted_at', patch.acceptedAt);
    if (patch.completedAt !== undefined) set('completed_at', patch.completedAt);
    if (!sets.length) return null;
    params.push(id);
    const { rows } = await query(`UPDATE assessment_assignments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapAssignment(rows[0]) : null;
  },

  // ---- Reviews ------------------------------------------------------------
  async createReview(input: {
    organizationId: string; assessmentId: string; reviewerId?: string | null; decision?: string;
    scope?: string; targetId?: string | null; summary?: string | null; scoreOverride?: number | null;
  }) {
    const { rows } = await query(
      `INSERT INTO assessment_reviews (organization_id, assessment_id, reviewer_id, decision, scope, target_id, summary, score_override)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [input.organizationId, input.assessmentId, input.reviewerId ?? null, input.decision ?? 'pending', input.scope ?? 'overall', input.targetId ?? null, input.summary ?? null, input.scoreOverride ?? null],
    );
    return mapReview(rows[0]);
  },
  async listReviews(assessmentId: string) {
    const { rows } = await query(`SELECT * FROM assessment_reviews WHERE assessment_id = $1 ORDER BY created_at`, [assessmentId]);
    return rows.map(mapReview);
  },
  async updateReview(id: string, patch: { decision?: string; summary?: string | null; scoreOverride?: number | null; reviewedAt?: Date | null }) {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.decision !== undefined) set('decision', patch.decision);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.scoreOverride !== undefined) set('score_override', patch.scoreOverride);
    if (patch.reviewedAt !== undefined) set('reviewed_at', patch.reviewedAt);
    if (!sets.length) return null;
    params.push(id);
    const { rows } = await query(`UPDATE assessment_reviews SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapReview(rows[0]) : null;
  },

  // ---- Approvals ----------------------------------------------------------
  async createApproval(input: { organizationId: string; assessmentId: string; approverId?: string | null; level?: number; decision?: string; notes?: string | null }) {
    const { rows } = await query(
      `INSERT INTO assessment_approvals (organization_id, assessment_id, approver_id, level, decision, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [input.organizationId, input.assessmentId, input.approverId ?? null, input.level ?? 1, input.decision ?? 'pending', input.notes ?? null],
    );
    return mapApproval(rows[0]);
  },
  async listApprovals(assessmentId: string) {
    const { rows } = await query(`SELECT * FROM assessment_approvals WHERE assessment_id = $1 ORDER BY level`, [assessmentId]);
    return rows.map(mapApproval);
  },
  async updateApproval(id: string, patch: { decision?: string; notes?: string | null; approvedAt?: Date | null }) {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.decision !== undefined) set('decision', patch.decision);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (!sets.length) return null;
    params.push(id);
    const { rows } = await query(`UPDATE assessment_approvals SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapApproval(rows[0]) : null;
  },

  // ---- Comments -----------------------------------------------------------
  async createComment(input: {
    organizationId: string; assessmentId: string; authorId?: string | null; kind?: string;
    scope?: string; targetId?: string | null; body: string; parentCommentId?: string | null;
  }): Promise<AssessmentComment> {
    const { rows } = await query(
      `INSERT INTO assessment_comments (organization_id, assessment_id, author_id, kind, scope, target_id, body, parent_comment_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [input.organizationId, input.assessmentId, input.authorId ?? null, input.kind ?? 'general', input.scope ?? 'assessment', input.targetId ?? null, input.body, input.parentCommentId ?? null],
    );
    return mapComment(rows[0]);
  },
  async listComments(assessmentId: string): Promise<AssessmentComment[]> {
    const { rows } = await query(`SELECT * FROM assessment_comments WHERE assessment_id = $1 ORDER BY created_at`, [assessmentId]);
    return rows.map(mapComment);
  },
  async resolveComment(id: string, resolved: boolean): Promise<void> {
    await query(`UPDATE assessment_comments SET is_resolved = $2 WHERE id = $1`, [id, resolved]);
  },

  // ---- Attachments --------------------------------------------------------
  async createAttachment(input: {
    organizationId: string; assessmentId: string; assessmentResponseId?: string | null; uploadedBy?: string | null;
    fileName: string; fileType?: string | null; fileSize?: number | null; storageKey: string; url?: string | null; kind?: string;
  }): Promise<AssessmentAttachment> {
    const { rows } = await query(
      `INSERT INTO assessment_attachments (organization_id, assessment_id, assessment_response_id, uploaded_by, file_name, file_type, file_size, storage_key, url, kind)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [input.organizationId, input.assessmentId, input.assessmentResponseId ?? null, input.uploadedBy ?? null, input.fileName, input.fileType ?? null, input.fileSize ?? null, input.storageKey, input.url ?? null, input.kind ?? 'file'],
    );
    return mapAttachment(rows[0]);
  },
  async listAttachments(assessmentId: string): Promise<AssessmentAttachment[]> {
    const { rows } = await query(`SELECT * FROM assessment_attachments WHERE assessment_id = $1 ORDER BY created_at`, [assessmentId]);
    return rows.map(mapAttachment);
  },

  // ---- Schedule placeholders ---------------------------------------------
  async createSchedulePlaceholder(input: {
    organizationId: string; templateId?: string | null; name: string; frequency?: string; intervalCount?: number;
    anchorDay?: number | null; anchorMonth?: number | null; scope?: string; siteId?: string | null;
    departmentId?: string | null; defaultAssigneeId?: string | null; description?: string | null;
  }): Promise<AssessmentSchedulePlaceholder> {
    const { rows } = await query(
      `INSERT INTO assessment_schedule_placeholders
        (organization_id, template_id, name, frequency, interval_count, anchor_day, anchor_month, scope, site_id, department_id, default_assignee_id, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [input.organizationId, input.templateId ?? null, input.name, input.frequency ?? 'monthly', input.intervalCount ?? 1, input.anchorDay ?? null,
        input.anchorMonth ?? null, input.scope ?? 'organization', input.siteId ?? null, input.departmentId ?? null, input.defaultAssigneeId ?? null, input.description ?? null],
    );
    return mapSchedulePlaceholder(rows[0]);
  },
  async listSchedulePlaceholders(organizationId: string): Promise<AssessmentSchedulePlaceholder[]> {
    const { rows } = await query(`SELECT * FROM assessment_schedule_placeholders WHERE organization_id = $1 AND is_active = TRUE ORDER BY name`, [organizationId]);
    return rows.map(mapSchedulePlaceholder);
  },

  // ---- Library (aggregated templates) ------------------------------------
  async library(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<AssessmentLibraryItem>> {
    const where: string[] = ['t.organization_id = $1', 't.is_archived = FALSE', '(t.latest_version_id IS NULL OR t.latest_version_id = t.id)'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.search) { where.push(`(t.title ILIKE $${i} OR t.code ILIKE $${i} OR t.description ILIKE $${i})`); params.push(`%${filters.search}%`); i++; }
    if (filters.type) { where.push(`t.type = $${i++}`); params.push(filters.type); }
    if (filters.categoryId) { where.push(`t.category_id = $${i++}`); params.push(filters.categoryId); }
    if (filters.status) { where.push(`t.status = $${i++}`); params.push(filters.status); }
    if (filters.tag) { where.push(`$${i} = ANY(t.tags)`); params.push(filters.tag); i++; }
    if (filters.framework) { where.push(`EXISTS (SELECT 1 FROM assessment_framework_mappings fm WHERE fm.template_id = t.id AND fm.framework = $${i++})`); params.push(filters.framework); }
    if (filters.version) { where.push(`t.version = $${i++}`); params.push(filters.version); }
    const sortCol = filters.sort === 'title' ? 't.title' : 't.updated_at';
    const dir = filters.order === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 20));
    const { rows: countRows } = await query<{ total: string }>(`SELECT COUNT(*) AS total FROM assessment_templates t WHERE ${where.join(' AND ')}`, params);
    const total = parseInt(countRows[0]?.total ?? '0', 10);
    const { rows } = await query<AssessmentLibraryItem & any>(
      `SELECT t.*, c.name AS category_name,
        (SELECT COUNT(*) FROM assessment_framework_mappings fm WHERE fm.template_id = t.id) AS framework_count,
        (SELECT COUNT(*) FROM assessment_questions q WHERE q.template_id = t.id) AS question_count,
        (SELECT COUNT(*) FROM assessment_sections s WHERE s.template_id = t.id) AS section_count
       FROM assessment_templates t LEFT JOIN assessment_categories c ON c.id = t.category_id
       WHERE ${where.join(' AND ')} ORDER BY ${sortCol} ${dir} LIMIT $${i++} OFFSET $${i++}`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    const data = rows.map((r) => {
      const base = mapTemplate(r) as AssessmentLibraryItem;
      base.frameworkCount = parseInt(r.framework_count, 10);
      base.questionCount = parseInt(r.question_count, 10);
      base.sectionCount = parseInt(r.section_count, 10);
      base.categoryName = r.category_name ?? null;
      return base;
    });
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async dashboard(organizationId: string) {
    const { rows } = await query<any>(
      `SELECT
         COUNT(*) FILTER (WHERE is_archived = FALSE AND status = 'published') AS published_templates,
         COUNT(*) FILTER (WHERE is_archived = FALSE) AS total_templates,
         (SELECT COUNT(*) FROM assessments a WHERE a.organization_id = $1) AS total_assessments,
         (SELECT COUNT(*) FROM assessments a WHERE a.organization_id = $1 AND a.status NOT IN ('completed','cancelled','archived','draft')) AS active_assessments
       FROM assessment_templates t WHERE t.organization_id = $1`,
      [organizationId],
    );
    const r = rows[0] ?? {};
    return {
      publishedTemplates: parseInt(r.published_templates ?? '0', 10),
      totalTemplates: parseInt(r.total_templates ?? '0', 10),
      totalAssessments: parseInt(r.total_assessments ?? '0', 10),
      activeAssessments: parseInt(r.active_assessments ?? '0', 10),
    };
  },
};
