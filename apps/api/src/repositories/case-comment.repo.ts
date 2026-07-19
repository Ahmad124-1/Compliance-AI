import { query } from '../db/pool.js';

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

export const caseCommentRepo = {
  async create(input) {
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

  async findById(id) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE id = $1`, [id]);
    return rows[0] ? mapCaseComment(rows[0]) : null;
  },

  async findCommentById(id) {
    return this.findById(id);
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE case_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseComment);
  },

  async findReplies(parentId) {
    const { rows } = await query(`SELECT * FROM case_comments WHERE parent_id = $1 AND is_deleted = FALSE ORDER BY created_at ASC`, [parentId]);
    return rows.map(mapCaseComment);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (patch.body !== undefined) { sets.push(`body = $${i++}`); params.push(patch.body); }
    if (patch.isEdited !== undefined) { sets.push(`is_edited = $${i++}`); params.push(patch.isEdited); }
    if (!sets.length) return this.findById(id);
    sets.push(`edited_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE case_comments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapCaseComment(rows[0]) : null;
  },

  async updateComment(id, patch: any) {
    return this.update(id, patch);
  },

  async delete(id) {
    await query(`UPDATE case_comments SET is_deleted = TRUE, updated_at = now() WHERE id = $1`, [id]);
  },

  async deleteComment(id) {
    return this.delete(id);
  },
};
