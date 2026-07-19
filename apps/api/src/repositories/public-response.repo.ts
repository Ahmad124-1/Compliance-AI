import { query } from '../db/pool.js';

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

export const publicResponseRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO public_responses (case_id, author_id, body, attachments)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.caseId, input.authorId, input.body, input.attachments ?? []],
    );
    return mapPublicResponse(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM public_responses WHERE id = $1`, [id]);
    return rows[0] ? mapPublicResponse(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM public_responses WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapPublicResponse);
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
    const { rows } = await query(`UPDATE public_responses SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapPublicResponse(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM public_responses WHERE id = $1`, [id]);
  },
};
