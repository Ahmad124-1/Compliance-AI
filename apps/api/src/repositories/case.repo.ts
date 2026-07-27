import { query } from '../db/pool.js';
import { audit } from '../core/audit.js';

/** @type {any} */
const mapCase = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  grievanceId: row.grievance_id,
  caseNumber: row.case_number,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  severity: row.severity,
  category: row.category,
  source: row.source,
  reporterName: row.reporter_name,
  reporterEmail: row.reporter_email,
  reporterPhone: row.reporter_phone,
  reporterAnonymous: row.reporter_anonymous,
  factoryId: row.factory_id,
  departmentId: row.department_id,
  country: row.country,
  assignedTo: row.assigned_to ?? [],
  labels: row.labels ?? [],
  tags: row.tags ?? [],
  dueDate: row.due_date,
  slaDeadline: row.sla_deadline,
  riskScore: row.risk_score,
  mergedInto: row.merged_into,
  duplicateOf: row.duplicate_of,
  isDeleted: row.is_deleted,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapCaseTag = (row) => ({
  id: row.id,
  caseId: row.case_id,
  tag: row.tag,
  color: row.color,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

/** @type {any} */
const mapCaseLabel = (row) => ({
  id: row.id,
  caseId: row.case_id,
  label: row.label,
  category: row.category,
  isSystem: row.is_system,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

/** @type {any} */
const mapCaseLink = (row) => ({
  id: row.id,
  caseId: row.case_id,
  relatedCaseId: row.related_case_id,
  linkType: row.link_type,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

/** @type {any} */
const mapCaseStatusHistory = (row) => ({
  id: row.id,
  caseId: row.case_id,
  changedBy: row.changed_by,
  oldStatus: row.old_status,
  newStatus: row.new_status,
  reason: row.reason,
  metadata: row.metadata,
  createdAt: row.created_at,
});

/** @type {any} */
const mapCaseActivity = (row) => ({
  id: row.id,
  caseId: row.case_id,
  actorId: row.actor_id,
  activityType: row.activity_type,
  description: row.description,
  metadata: row.metadata,
  createdAt: row.created_at,
});

/** @type {any} */
const mapCaseComment = (row) => ({
  id: row.id,
  caseId: row.case_id,
  authorId: row.author_id,
  parentId: row.parent_id,
  body: row.body,
  isInternal: row.is_internal,
  isEdited: row.is_edited,
  editedAt: row.edited_at,
  mentions: row.mentions ?? [],
  attachments: row.attachments ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapInternalNote = (row) => ({
  id: row.id,
  caseId: row.case_id,
  authorId: row.author_id,
  title: row.title,
  body: row.body,
  isPinned: row.is_pinned,
  mentions: row.mentions ?? [],
  attachments: row.attachments ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapPublicResponse = (row) => ({
  id: row.id,
  caseId: row.case_id,
  authorId: row.author_id,
  body: row.body,
  isEdited: row.is_edited,
  editedAt: row.edited_at,
  attachments: row.attachments ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapSavedFilter = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  userId: row.user_id,
  name: row.name,
  filters: row.filters,
  isShared: row.is_shared,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapWatcher = (row) => ({
  id: row.id,
  caseId: row.case_id,
  userId: row.user_id,
  createdAt: row.created_at,
});

function buildCaseWhere(filters, startParam = 1) {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = startParam;
  conditions.push(`c.is_deleted = FALSE`);
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
  const where = `WHERE ${conditions.join(' AND ')}`;
  return { where, params, nextParam: i };
}

export const caseRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO cases (organization_id, grievance_id, case_number, title, description, status, priority, severity, category, source, reporter_name, reporter_email, reporter_phone, reporter_anonymous, factory_id, department_id, country, assigned_to, labels, tags, due_date, sla_deadline, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        input.organizationId,
        input.grievanceId ?? null,
        input.caseNumber,
        input.title,
        input.description,
        input.status ?? 'open',
        input.priority ?? 'medium',
        input.severity ?? 'medium',
        input.category,
        input.source,
        input.reporterName ?? null,
        input.reporterEmail ?? null,
        input.reporterPhone ?? null,
        input.reporterAnonymous ?? true,
        input.factoryId ?? null,
        input.departmentId ?? null,
        input.country ?? null,
        input.assignedTo ?? [],
        input.labels ?? [],
        input.tags ?? [],
        input.dueDate ?? null,
        input.slaDeadline ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapCase(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM cases WHERE id = $1 AND is_deleted = FALSE`, [id]);
    return rows[0] ? mapCase(rows[0]) : null;
  },

  async findByCaseNumber(orgId, caseNumber) {
    const { rows } = await query(`SELECT * FROM cases WHERE organization_id = $1 AND case_number = $2 AND is_deleted = FALSE`, [orgId, caseNumber]);
    return rows[0] ? mapCase(rows[0]) : null;
  },

  async listByOrganization(orgId, filters: any = {}) {
    const { where, params, nextParam } = buildCaseWhere({ ...filters });
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const sortBy = filters.sortBy ?? 'created_at';
    const sortOrder = filters.sortOrder ?? 'DESC';

    const countSql = `SELECT COUNT(*) FROM cases c ${where}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataSql = `SELECT * FROM cases c ${where} ORDER BY c.${sortBy} ${sortOrder} LIMIT $${nextParam} OFFSET $${nextParam + 1}`;
    const dataParams = [...params, limit, offset];
    const { rows } = await query(dataSql, dataParams);

    return { cases: rows.map(mapCase), total };
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };

    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.source !== undefined) set('source', patch.source);
    if (patch.reporterName !== undefined) set('reporter_name', patch.reporterName);
    if (patch.reporterEmail !== undefined) set('reporter_email', patch.reporterEmail);
    if (patch.reporterPhone !== undefined) set('reporter_phone', patch.reporterPhone);
    if (patch.reporterAnonymous !== undefined) set('reporter_anonymous', patch.reporterAnonymous);
    if (patch.factoryId !== undefined) set('factory_id', patch.factoryId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.country !== undefined) set('country', patch.country);
    if (patch.assignedTo !== undefined) set('assigned_to', patch.assignedTo);
    if (patch.labels !== undefined) set('labels', patch.labels);
    if (patch.tags !== undefined) set('tags', patch.tags);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.slaDeadline !== undefined) set('sla_deadline', patch.slaDeadline);
    if (patch.riskScore !== undefined) set('risk_score', patch.riskScore);
    if (patch.mergedInto !== undefined) set('merged_into', patch.mergedInto);
    if (patch.duplicateOf !== undefined) set('duplicate_of', patch.duplicateOf);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE cases SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapCase(rows[0]) : null;
  },

  async delete(id) {
    await query(`UPDATE cases SET is_deleted = TRUE, updated_at = now() WHERE id = $1`, [id]);
  },

  async restore(id) {
    await query(`UPDATE cases SET is_deleted = FALSE, updated_at = now() WHERE id = $1`, [id]);
  },

  async merge(targetId, sourceIds) {
    await query(`UPDATE cases SET merged_into = $1, updated_at = now() WHERE id = ANY($2) AND id != $1`, [targetId, sourceIds]);
  },

  async findDuplicates(orgId, caseId) {
    const { rows } = await query(
      `SELECT c.* FROM cases c
       WHERE c.organization_id = $1
         AND c.id != $2
         AND c.is_deleted = FALSE
         AND (
           (c.category = (SELECT category FROM cases WHERE id = $2) AND c.factory_id = (SELECT factory_id FROM cases WHERE id = $2) AND ABS(EXTRACT(EPOCH FROM (c.created_at - (SELECT created_at FROM cases WHERE id = $2)))) < 86400)
           OR similarity(c.title, (SELECT title FROM cases WHERE id = $2)) > 0.4
         )`,
      [orgId, caseId],
    );
    return rows.map(mapCase);
  },

  async linkCase(caseId, relatedCaseId, linkType) {
    const { rows } = await query(
      `INSERT INTO case_links (case_id, related_case_id, link_type, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (case_id, related_case_id, link_type) DO UPDATE SET case_id = EXCLUDED.case_id
       RETURNING *`,
      [caseId, relatedCaseId, linkType ?? 'related', null],
    );
    return mapCaseLink(rows[0]);
  },

  async unlinkCase(caseId, relatedCaseId, linkType) {
    await query(`DELETE FROM case_links WHERE case_id = $1 AND related_case_id = $2 AND link_type = $3`, [caseId, relatedCaseId, linkType ?? 'related']);
  },

  async getRelatedCases(caseId) {
    const { rows } = await query(
      `SELECT cl.*, c.case_number, c.title, c.status, c.priority FROM case_links cl
       JOIN cases c ON c.id = cl.related_case_id
       WHERE cl.case_id = $1 AND c.is_deleted = FALSE
       ORDER BY cl.created_at DESC`,
      [caseId],
    );
    return rows.map((r) => ({ ...mapCaseLink(r), relatedCase: { caseNumber: r.case_number, title: r.title, status: r.status, priority: r.priority } }));
  },

  async addTag(caseId, tag, userId) {
    const { rows } = await query(
      `INSERT INTO case_tags (case_id, tag, created_by) VALUES ($1, $2, $3) ON CONFLICT (case_id, tag) DO UPDATE SET case_id = EXCLUDED.case_id RETURNING *`,
      [caseId, tag, userId ?? null],
    );
    await audit({ action: 'case.tag.add', entity: 'case', entityId: caseId, metadata: { tag } });
    return mapCaseTag(rows[0]);
  },

  async removeTag(caseId, tag) {
    await query(`DELETE FROM case_tags WHERE case_id = $1 AND tag = $2`, [caseId, tag]);
    await audit({ action: 'case.tag.remove', entity: 'case', entityId: caseId, metadata: { tag } });
  },

  async addLabel(caseId, label, userId) {
    const { rows } = await query(
      `INSERT INTO case_labels (case_id, label, created_by) VALUES ($1, $2, $3) ON CONFLICT (case_id, label) DO UPDATE SET case_id = EXCLUDED.case_id RETURNING *`,
      [caseId, label, userId ?? null],
    );
    await audit({ action: 'case.label.add', entity: 'case', entityId: caseId, metadata: { label } });
    return mapCaseLabel(rows[0]);
  },

  async removeLabel(caseId, label) {
    await query(`DELETE FROM case_labels WHERE case_id = $1 AND label = $2`, [caseId, label]);
    await audit({ action: 'case.label.remove', entity: 'case', entityId: caseId, metadata: { label } });
  },

  async getWatchers(caseId) {
    const { rows } = await query(`SELECT * FROM case_watchers WHERE case_id = $1`, [caseId]);
    return rows.map(mapWatcher);
  },

  async addWatcher(caseId, userId) {
    const { rows } = await query(
      `INSERT INTO case_watchers (case_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [caseId, userId],
    );
    await audit({ action: 'case.watcher.add', entity: 'case', entityId: caseId, metadata: { userId } });
    return rows[0] ? mapWatcher(rows[0]) : null;
  },

  async removeWatcher(caseId, userId) {
    await query(`DELETE FROM case_watchers WHERE case_id = $1 AND user_id = $2`, [caseId, userId]);
    await audit({ action: 'case.watcher.remove', entity: 'case', entityId: caseId, metadata: { userId } });
  },

  async saveFilter(orgId, userId, name, filters, isShared) {
    const { rows } = await query(
      `INSERT INTO saved_case_filters (organization_id, user_id, name, filters, is_shared) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orgId, userId, name, JSON.stringify(filters), isShared ?? false],
    );
    return mapSavedFilter(rows[0]);
  },

  async listSavedFilters(orgId, userId) {
    const { rows } = await query(
      `SELECT * FROM saved_case_filters WHERE organization_id = $1 AND (user_id = $2 OR is_shared = TRUE) ORDER BY name`,
      [orgId, userId],
    );
    return rows.map(mapSavedFilter);
  },

  async deleteFilter(id) {
    await query(`DELETE FROM saved_case_filters WHERE id = $1`, [id]);
  },

  async createStatusHistory(input) {
    const { rows } = await query(
      `INSERT INTO case_status_history (case_id, changed_by, old_status, new_status, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.caseId, input.changedBy ?? null, input.oldStatus ?? null, input.newStatus, input.reason ?? null, JSON.stringify(input.metadata ?? {})],
    );
    return mapCaseStatusHistory(rows[0]);
  },

  async createActivity(input) {
    const { rows } = await query(
      `INSERT INTO case_activities (case_id, actor_id, activity_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.caseId, input.actorId ?? null, input.activityType, input.description, JSON.stringify(input.metadata ?? {})],
    );
    return mapCaseActivity(rows[0]);
  },

  async listActivities(caseId, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM case_activities WHERE case_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [caseId, limit, offset],
    );
    return rows.map(mapCaseActivity);
  },

  async createComment(input) {
    const { rows } = await query(
      `INSERT INTO case_comments (case_id, author_id, parent_id, body, is_internal, mentions, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.caseId,
        input.authorId,
        input.parentId ?? null,
        input.body,
        input.isInternal ?? true,
        input.mentions ?? [],
        input.attachments ?? [],
      ],
    );
    return mapCaseComment(rows[0]);
  },

  async findCommentById(id) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE id = $1`, [id]);
    return rows[0] ? mapCaseComment(rows[0]) : null;
  },

  async findCommentsByCase(caseId) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE case_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseComment);
  },

  async findReplies(parentId) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE parent_id = $1 AND is_deleted = FALSE ORDER BY created_at ASC`, [parentId]);
    return rows.map(mapCaseComment);
  },

  async updateComment(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (patch.body !== undefined) { sets.push(`body = $${i++}`); params.push(patch.body); }
    if (patch.isEdited !== undefined) { sets.push(`is_edited = $${i++}`); params.push(patch.isEdited); }
    if (!sets.length) return this.findCommentById(id);
    sets.push(`edited_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE case_comments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapCaseComment(rows[0]) : null;
  },

  async deleteComment(id) {
    await query(`UPDATE case_comments SET is_deleted = TRUE, updated_at = now() WHERE id = $1`, [id]);
  },

  async createInternalNote(input) {
    const { rows } = await query(
      `INSERT INTO internal_notes (case_id, author_id, title, body, is_pinned, mentions, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.caseId,
        input.authorId,
        input.title,
        input.body,
        input.isPinned ?? false,
        input.mentions ?? [],
        input.attachments ?? [],
      ],
    );
    return mapInternalNote(rows[0]);
  },

  async findInternalNoteById(id) {
    const { rows } = await query(`SELECT * FROM internal_notes WHERE id = $1`, [id]);
    return rows[0] ? mapInternalNote(rows[0]) : null;
  },

  async findInternalNotesByCase(caseId) {
    const { rows } = await query(`SELECT * FROM internal_notes WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapInternalNote);
  },

  async updateInternalNote(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (patch.title !== undefined) { sets.push(`title = $${i++}`); params.push(patch.title); }
    if (patch.body !== undefined) { sets.push(`body = $${i++}`); params.push(patch.body); }
    if (patch.isPinned !== undefined) { sets.push(`is_pinned = $${i++}`); params.push(patch.isPinned); }
    if (!sets.length) return this.findInternalNoteById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE internal_notes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapInternalNote(rows[0]) : null;
  },

  async deleteInternalNote(id) {
    await query(`DELETE FROM internal_notes WHERE id = $1`, [id]);
  },

  async createPublicResponse(input) {
    const { rows } = await query(
      `INSERT INTO public_responses (case_id, author_id, body, attachments)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.caseId, input.authorId, input.body, input.attachments ?? []],
    );
    return mapPublicResponse(rows[0]);
  },

  async findPublicResponseById(id) {
    const { rows } = await query(`SELECT * FROM public_responses WHERE id = $1`, [id]);
    return rows[0] ? mapPublicResponse(rows[0]) : null;
  },

  async findPublicResponsesByCase(caseId) {
    const { rows } = await query(`SELECT * FROM public_responses WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapPublicResponse);
  },

  async updatePublicResponse(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (patch.body !== undefined) { sets.push(`body = $${i++}`); params.push(patch.body); }
    if (patch.isEdited !== undefined) { sets.push(`is_edited = $${i++}`); params.push(patch.isEdited); }
    if (!sets.length) return this.findPublicResponseById(id);
    sets.push(`edited_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE public_responses SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapPublicResponse(rows[0]) : null;
  },

  async deletePublicResponse(id) {
    await query(`DELETE FROM public_responses WHERE id = $1`, [id]);
  },

  async listStatusHistory(caseId) {
    const { rows } = await query(`SELECT * FROM case_status_history WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseStatusHistory);
  },
};
