import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { caseRepo } from '../repositories/case.repo.js';
import { caseActivityRepo } from '../repositories/case-activity.repo.js';
import { caseCommentRepo } from '../repositories/case-comment.repo.js';
import { caseStatusHistoryRepo } from '../repositories/case-status-history.repo.js';
import { internalNoteRepo } from '../repositories/internal-note.repo.js';
import { publicResponseRepo } from '../repositories/public-response.repo.js';
import { caseTagRepo } from '../repositories/case-tag.repo.js';
import { caseLabelRepo } from '../repositories/case-label.repo.js';
import { evidenceRepo } from '../repositories/evidence.repo.js';
import { witnessRepo } from '../repositories/witness.repo.js';
import { interviewRepo } from '../repositories/interview.repo.js';
import { findingRepo } from '../repositories/finding.repo.js';
import { rootCauseRepo } from '../repositories/root-cause.repo.js';
import { resolutionRepo } from '../repositories/resolution.repo.js';
import { investigationRepo } from '../repositories/investigation.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { riskScoreRepo } from '../repositories/risk-score.repo.js';
import { query } from '../db/pool.js';

export interface CreateCaseInput {
  organizationId: string;
  grievanceId?: string | null;
  title: string;
  description: string;
  category: string;
  source: string;
  priority?: string;
  severity?: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  reporterAnonymous?: boolean;
  factoryId?: string | null;
  departmentId?: string | null;
  country?: string | null;
  assignedTo?: string[];
  labels?: string[];
  tags?: string[];
  dueDate?: Date | null;
  slaDeadline?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface CaseFilters {
  status?: string;
  priority?: string;
  category?: string;
  source?: string;
  factoryId?: string;
  departmentId?: string;
  assignedTo?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  labels?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

async function generateCaseNumber(orgId) {
  const org = await organizationRepo.findById(orgId);
  if (!org) throw new NotFoundError('Organization not found');
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const { rows } = await query(
    `SELECT COUNT(*) + 1 AS seq FROM cases WHERE organization_id = $1 AND case_number LIKE $2`,
    [orgId, `CASE-${org.slug}-${yyyymmdd}-%`],
  );
  const seq = String(rows[0].seq).padStart(4, '0');
  return `CASE-${org.slug}-${yyyymmdd}-${seq}`;
}

export const caseService = {
  async createCase(input: CreateCaseInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const caseNumber = await generateCaseNumber(input.organizationId);
    const case_ = await caseRepo.create({
      ...input,
      caseNumber,
    });
    await caseStatusHistoryRepo.create({
      caseId: case_.id,
      changedBy: actorId ?? null,
      newStatus: case_.status,
      activityType: 'created',
      description: 'Case created',
    });
    await caseActivityRepo.create({
      caseId: case_.id,
      actorId: actorId ?? null,
      activityType: 'created',
      description: 'Case created',
    });
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'case.create', entity: 'case', entityId: case_.id });
    return case_;
  },

  async getCase(orgId, id) {
    const case_ = await caseRepo.findById(id);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    const [activities, comments, notes, responses, evidence, witnesses, interviews, findings, rootCauses, resolutions, statusHistory, watchers, tags, labels, links, investigation, riskScore] = await Promise.all([
      caseActivityRepo.listByCase(case_.id),
      caseCommentRepo.findByCaseId(case_.id),
      internalNoteRepo.findByCaseId(case_.id),
      publicResponseRepo.findByCaseId(case_.id),
      evidenceRepo.findByCaseId(case_.id),
      witnessRepo.findByCaseId(case_.id),
      interviewRepo.findByCaseId(case_.id),
      findingRepo.findByCaseId(case_.id),
      rootCauseRepo.findByCaseId(case_.id),
      resolutionRepo.findByCaseId(case_.id),
      caseStatusHistoryRepo.listByCase(case_.id),
      caseRepo.getWatchers(case_.id),
      caseTagRepo.listByCase(case_.id),
      caseLabelRepo.listByCase(case_.id),
      caseRepo.getRelatedCases(case_.id),
      investigationRepo.findByCaseId(case_.id),
      riskScoreRepo.findByCaseId(case_.id),
    ]);
    return { ...case_, activities, comments, notes, responses, evidence, witnesses, interviews, findings, rootCauses, resolutions, statusHistory, watchers, tags, labels, links, investigation, riskScore };
  },

  async listCases(orgId, filters: any = {}) {
    return caseRepo.listByOrganization(orgId, filters);
  },

  async updateCase(orgId, id, patch, actorId) {
    const case_ = await caseRepo.findById(id);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    const oldStatus = case_.status;
    const updated = await caseRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Case not found');
    if (patch.status && patch.status !== oldStatus) {
      await caseStatusHistoryRepo.create({
        caseId: id,
        changedBy: actorId ?? null,
        oldStatus,
        newStatus: patch.status,
      });
      await caseActivityRepo.create({
        caseId: id,
        actorId: actorId ?? null,
        activityType: 'status_changed',
        description: `Status changed from ${oldStatus} to ${patch.status}`,
      });
    } else if (patch.status === undefined || Object.keys(patch).length > 0) {
      await caseActivityRepo.create({
        caseId: id,
        actorId: actorId ?? null,
        activityType: 'updated',
        description: 'Case updated',
      });
    }
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'case.update', entity: 'case', entityId: id });
    return updated;
  },

  async deleteCase(orgId, id, actorId) {
    const case_ = await caseRepo.findById(id);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseRepo.delete(id);
    await caseActivityRepo.create({ caseId: id, actorId: actorId ?? null, activityType: 'deleted', description: 'Case deleted' });
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'case.delete', entity: 'case', entityId: id });
  },

  async restoreCase(orgId, id, actorId) {
    const case_ = await caseRepo.findById(id);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseRepo.restore(id);
    await caseActivityRepo.create({ caseId: id, actorId: actorId ?? null, activityType: 'restored', description: 'Case restored' });
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'case.restore', entity: 'case', entityId: id });
  },

  async mergeCases(orgId, targetId, sourceIds) {
    const target = await caseRepo.findById(targetId);
    if (!target || target.organizationId !== orgId) throw new NotFoundError('Target case not found');
    await caseRepo.merge(targetId, sourceIds);
    await audit({ organizationId: orgId, action: 'case.merge', entity: 'case', entityId: targetId, metadata: { sourceIds } });
    return target;
  },

  async findDuplicates(orgId, caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return caseRepo.findDuplicates(orgId, caseId);
  },

  async addTag(orgId, caseId, tag) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return caseRepo.addTag(caseId, tag, null);
  },

  async removeTag(orgId, caseId, tag) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseRepo.removeTag(caseId, tag);
  },

  async addLabel(orgId, caseId, label) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return caseRepo.addLabel(caseId, label, null);
  },

  async removeLabel(orgId, caseId, label) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseRepo.removeLabel(caseId, label);
  },

  async addWatcher(orgId, caseId, userId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return caseRepo.addWatcher(caseId, userId);
  },

  async removeWatcher(orgId, caseId, userId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseRepo.removeWatcher(caseId, userId);
  },

  async assignCase(orgId, caseId, userId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    const assignedTo = [...(case_.assignedTo ?? [])];
    if (!assignedTo.includes(userId)) assignedTo.push(userId);
    const updated = await caseRepo.update(caseId, { assignedTo });
    await caseRepo.createActivity({ caseId, actorId: userId, activityType: 'assigned', description: `User ${userId} assigned to case` });
    return updated;
  },

  async unassignCase(orgId, caseId, userId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    const assignedTo = (case_.assignedTo ?? []).filter((id) => id !== userId);
    const updated = await caseRepo.update(caseId, { assignedTo });
    await caseRepo.createActivity({ caseId, actorId: userId, activityType: 'unassigned', description: `User ${userId} unassigned from case` });
    return updated;
  },

  async addComment(orgId, caseId, authorId, body, isInternal = true, parentId = null) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    const comment = await caseCommentRepo.create({ caseId, authorId, body, isInternal, parentId });
    await caseActivityRepo.create({ caseId, actorId: authorId, activityType: 'comment_added', description: isInternal ? 'Internal note added' : 'Public comment added' });
    return comment;
  },

  async updateComment(orgId, caseId, commentId, body) {
    const comment = await caseCommentRepo.findCommentById(commentId);
    if (!comment || comment.caseId !== caseId) throw new NotFoundError('Comment not found');
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return caseCommentRepo.updateComment(commentId, { body, isEdited: true });
  },

  async deleteComment(orgId, caseId, commentId) {
    const comment = await caseCommentRepo.findCommentById(commentId);
    if (!comment || comment.caseId !== caseId) throw new NotFoundError('Comment not found');
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    await caseCommentRepo.deleteComment(commentId);
  },

  async addInternalNote(orgId, caseId, authorId, title, body) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return internalNoteRepo.create({ caseId, authorId, title, body });
  },

  async addPublicResponse(orgId, caseId, authorId, body) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return publicResponseRepo.create({ caseId, authorId, body });
  },

  async addEvidence(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return evidenceRepo.create({ ...input, caseId });
  },

  async getEvidence(orgId, caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return evidenceRepo.findByCaseId(caseId);
  },

  async addWitness(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return witnessRepo.create({ ...input, caseId });
  },

  async addInterview(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return interviewRepo.create({ ...input, caseId });
  },

  async addFinding(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return findingRepo.create({ ...input, caseId });
  },

  async addRootCause(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return rootCauseRepo.create({ ...input, caseId });
  },

  async addResolution(orgId, caseId, input) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return resolutionRepo.create({ ...input, caseId });
  },

  async getCaseStats(orgId, filters: any = {}) {
    const { where, params } = buildCaseWhere(filters);
    const statusSql = `SELECT status, COUNT(*) AS count FROM cases c ${where} AND c.is_deleted = FALSE GROUP BY status`;
    const prioritySql = `SELECT priority, COUNT(*) AS count FROM cases c ${where} AND c.is_deleted = FALSE GROUP BY priority`;
    const totalSql = `SELECT COUNT(*) AS total FROM cases c ${where} AND c.is_deleted = FALSE`;
    const [statusResult, priorityResult, totalResult] = await Promise.all([
      query(statusSql, params),
      query(prioritySql, params),
      query(totalSql, params),
    ]);
    return {
      total: parseInt(totalResult.rows[0]?.total ?? '0', 10),
      byStatus: statusResult.rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      byPriority: priorityResult.rows.reduce((acc, r) => { acc[r.priority] = parseInt(r.count, 10); return acc; }, {}),
    };
  },

  async bulkUpdate(orgId, caseIds, patch, actorId) {
    for (const caseId of caseIds) {
      const case_ = await caseRepo.findById(caseId);
      if (case_ && case_.organizationId === orgId) {
        await this.updateCase(orgId, caseId, patch, actorId);
      }
    }
  },

  async bulkDelete(orgId, caseIds, actorId) {
    for (const caseId of caseIds) {
      await this.deleteCase(orgId, caseId, actorId);
    }
  },

  async bulkRestore(orgId, caseIds, actorId) {
    for (const caseId of caseIds) {
      await this.restoreCase(orgId, caseId, actorId);
    }
  },
};

function buildCaseWhere(filters: any, startParam = 1) {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = startParam;
  if (filters.status) { conditions.push(`c.status = $${i++}`); params.push(filters.status); }
  if (filters.priority) { conditions.push(`c.priority = $${i++}`); params.push(filters.priority); }
  if (filters.category) { conditions.push(`c.category = $${i++}`); params.push(filters.category); }
  if (filters.source) { conditions.push(`c.source = $${i++}`); params.push(filters.source); }
  if (filters.factoryId) { conditions.push(`c.factory_id = $${i++}`); params.push(filters.factoryId); }
  if (filters.departmentId) { conditions.push(`c.department_id = $${i++}`); params.push(filters.departmentId); }
  if (filters.assignedTo && filters.assignedTo.length) { conditions.push(`c.assigned_to && $${i++}`); params.push(filters.assignedTo); }
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(`(c.title ILIKE $${i++} OR c.description ILIKE $${i++} OR c.case_number ILIKE $${i++} OR c.reporter_name ILIKE $${i++})`);
    params.push(term, term, term, term);
  }
  if (filters.dateFrom) { conditions.push(`c.created_at >= $${i++}`); params.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push(`c.created_at <= $${i++}`); params.push(filters.dateTo); }
  if (filters.labels && filters.labels.length) { conditions.push(`c.labels && $${i++}`); params.push(filters.labels); }
  if (filters.tags && filters.tags.length) { conditions.push(`c.tags && $${i++}`); params.push(filters.tags); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params, nextParam: i };
}
