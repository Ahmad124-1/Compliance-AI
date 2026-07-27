import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierAssessmentRecord, AssessmentAnswer, AssessmentQuestion, AssessmentScoring, AssessmentHistoryRecord } from '../modules/supplier-esg/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

function computeScoring(questions: AssessmentQuestion[], answers: AssessmentAnswer[]): AssessmentScoring {
  let overall = 0; let env = 0; let soc = 0; let gov = 0; let hs = 0; let maxOverall = 0; let count = 0;
  const byCategory: Record<string, { score: number; maxScore: number }> = {};
  for (const q of questions) {
    const answer = answers.find((a) => a.questionId === q.id);
    const score = answer?.score ?? 0;
    const maxScore = q.maxScore;
    maxOverall += maxScore;
    const cat = q.category;
    if (!byCategory[cat]) byCategory[cat] = { score: 0, maxScore: 0 };
    byCategory[cat].score += score;
    byCategory[cat].maxScore += maxScore;
    count += 1;
  }
  for (const [cat, val] of Object.entries(byCategory)) {
    const pct = val.maxScore > 0 ? Math.round((val.score / val.maxScore) * 100) : 0;
    if (cat === 'environmental') env = pct;
    else if (cat === 'social') soc = pct;
    else if (cat === 'governance') gov = pct;
    else if (cat === 'health_safety') hs = pct;
  }
  overall = maxOverall > 0 ? Math.round(((env + soc + gov + hs) / 4)) : 0;
  return { overallScore: overall, environmentalScore: env, socialScore: soc, governanceScore: gov, healthSafetyScore: hs, categoryScores: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.maxScore > 0 ? Math.round((v.score / v.maxScore) * 100) : 0])), maxPossibleScore: maxOverall, percentage: maxOverall > 0 ? Math.round(((env + soc + gov + hs) / 4)) : 0 };
}

export const supplierEsgService = {
  async createAssessment(organizationId: string, supplierId: string, input: Partial<SupplierAssessmentRecord> & { title: string; category: string; questions: AssessmentQuestion[] }, actorId?: string | null): Promise<SupplierAssessmentRecord> {
    const record: SupplierAssessmentRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      title: input.title,
      description: input.description ?? null,
      category: input.category as any,
      questions: input.questions,
      answers: [],
      evidence: [],
      scoring: { overallScore: 0, environmentalScore: 0, socialScore: 0, governanceScore: 0, healthSafetyScore: 0, categoryScores: {}, maxPossibleScore: 0, percentage: 0 },
      reviewerId: null,
      reviewerName: null,
      approvalStatus: 'pending',
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      dueDate: input.dueDate ?? null,
      completedAt: null,
      version: 1,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO supplier_assessments (id, organization_id, supplier_id, title, description, category, questions, evidence, scoring, reviewer_id, reviewer_name, approval_status, approved_by_id, approved_at, due_date, version, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [record.id, record.organizationId, record.supplierId, record.title, record.description, record.category, JSON.stringify(record.questions), JSON.stringify(record.evidence), JSON.stringify(record.scoring), record.reviewerId, record.reviewerName, record.approvalStatus, record.approvedById, record.approvedAt, record.dueDate, record.version, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_assessment.create', entity: 'supplier_assessment', entityId: record.id });
    return record;
  },

  async listAssessments(organizationId: string, supplierId?: string): Promise<SupplierAssessmentRecord[]> {
    let sql = `SELECT * FROM supplier_assessments WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    if (supplierId) { sql += ` AND supplier_id = $2`; params.push(supplierId); }
    sql += ` ORDER BY created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierAssessmentRecord>);
  },

  async getAssessment(id: string, organizationId: string): Promise<SupplierAssessmentRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_assessments WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Assessment not found');
    const row = mapRow<SupplierAssessmentRecord>(rows[0]);
    row.questions = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions;
    row.answers = typeof row.answers === 'string' ? JSON.parse(row.answers) : (row.answers ?? []);
    row.evidence = typeof row.evidence === 'string' ? JSON.parse(row.evidence) : (row.evidence ?? []);
    row.scoring = typeof row.scoring === 'string' ? JSON.parse(row.scoring) : (row.scoring ?? {});
    row.history = Array.isArray(row.history) ? row.history : [];
    return row;
  },

  async submitAssessment(id: string, organizationId: string, answers: AssessmentAnswer[], actorId?: string | null): Promise<SupplierAssessmentRecord> {
    const existing = await this.getAssessment(id, organizationId);
    const scoring = computeScoring(existing.questions, answers);
    const updated: SupplierAssessmentRecord = { ...existing, answers, scoring, status: 'submitted', approvalStatus: 'pending', updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_assessments SET answers=$2, scoring=$3, status='submitted', approval_status='pending', updated_at=NOW() WHERE id=$1`, [id, JSON.stringify(answers), JSON.stringify(scoring)]);
    const historyEntry: AssessmentHistoryRecord = { id: randomUUID(), assessmentId: id, action: 'assessment.submitted', actorId: actorId ?? null, actorName: null, details: 'Assessment submitted for review', createdAt: new Date().toISOString() };
    await query(`UPDATE supplier_assessments SET history = COALESCE(history, '[]'::jsonb) || $2::jsonb WHERE id = $1`, [id, JSON.stringify([historyEntry])]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_assessment.submit', entity: 'supplier_assessment', entityId: id });
    return this.getAssessment(id, organizationId);
  },

  async reviewAssessment(id: string, organizationId: string, action: string, reviewerId?: string | null, reviewerName?: string | null, notes?: string | null, actorId?: string | null): Promise<SupplierAssessmentRecord> {
    const existing = await this.getAssessment(id, organizationId);
    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : existing.status;
    const newApprovalStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'request_changes' ? 'requested_changes' : existing.approvalStatus;
    const updated = { ...existing, status: newStatus, approvalStatus: newApprovalStatus, reviewerId: reviewerId ?? existing.reviewerId, reviewerName: reviewerName ?? existing.reviewerName, approvedById: action === 'approve' ? reviewerId : existing.approvedById, approvedByName: action === 'approve' ? reviewerName : existing.approvedByName, approvedAt: action === 'approve' ? new Date().toISOString() : existing.approvedAt, updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_assessments SET status=$2, approval_status=$3, reviewer_id=$4, reviewer_name=$5, approved_by_id=$6, approved_by_name=$7, approved_at=$8, updated_at=NOW() WHERE id=$1`, [id, updated.status, updated.approvalStatus, updated.reviewerId, updated.reviewerName, updated.approvedById, updated.approvedByName, updated.approvedAt]);
    const historyEntry: AssessmentHistoryRecord = { id: randomUUID(), assessmentId: id, action: `assessment.${action}`, actorId: actorId ?? null, actorName: reviewerName ?? null, details: notes ?? `Assessment ${action}`, createdAt: new Date().toISOString() };
    await query(`UPDATE supplier_assessments SET history = COALESCE(history, '[]'::jsonb) || $2::jsonb WHERE id = $1`, [id, JSON.stringify([historyEntry])]);
    await audit({ organizationId, actorId: actorId ?? null, action: `supplier_assessment.${action}`, entity: 'supplier_assessment', entityId: id });
    return this.getAssessment(id, organizationId);
  },

  async deleteAssessment(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_assessments SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_assessment.delete', entity: 'supplier_assessment', entityId: id });
  },

  async getAssessmentSummary(organizationId: string, supplierId: string): Promise<{ total: number; byCategory: Record<string, number>; avgOverallScore: number; byStatus: Record<string, number> }> {
    const { rows } = await query<Record<string, any>>(`SELECT category, status, overall_score FROM supplier_assessments WHERE supplier_id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [supplierId, organizationId]);
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalScore = 0; let count = 0;
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      totalScore += r.overall_score; count += 1;
    }
    return { total: rows.length, byCategory, avgOverallScore: count > 0 ? Math.round(totalScore / count) : 0, byStatus };
  },
};