import { query } from '../db/pool.js';

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

export const internalNoteRepo = {
  async create(input) {
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

  async findById(id) {
    const { rows } = await query(`SELECT * FROM internal_notes WHERE id = $1`, [id]);
    return rows[0] ? mapInternalNote(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM internal_notes WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapInternalNote);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (patch.title !== undefined) { sets.push(`title = $${i++}`); params.push(patch.title); }
    if (patch.body !== undefined) { sets.push(`body = $${i++}`); params.push(patch.body); }
    if (patch.isPinned !== undefined) { sets.push(`is_pinned = $${i++}`); params.push(patch.isPinned); }
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE internal_notes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapInternalNote(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM internal_notes WHERE id = $1`, [id]);
  },
};
