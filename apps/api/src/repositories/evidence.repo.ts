import { query } from '../db/pool.js';

/** @type {any} */
const mapEvidence = (row) => ({
  id: row.id,
  caseId: row.case_id,
  uploadedBy: row.uploaded_by,
  filename: row.filename,
  originalFilename: row.original_filename,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  storagePath: row.storage_path,
  description: row.description,
  category: row.category,
  tags: row.tags ?? [],
  version: row.version,
  parentEvidenceId: row.parent_evidence_id,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const evidenceRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO evidence (case_id, uploaded_by, filename, original_filename, mime_type, size_bytes, storage_path, description, category, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.caseId,
        input.uploadedBy,
        input.filename,
        input.originalFilename,
        input.mimeType,
        input.sizeBytes,
        input.storagePath,
        input.description ?? null,
        input.category ?? null,
        input.tags ?? [],
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapEvidence(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM evidence WHERE id = $1`, [id]);
    return rows[0] ? mapEvidence(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM evidence WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapEvidence);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.tags !== undefined) set('tags', patch.tags);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE evidence SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapEvidence(rows[0]) : null;
  },

  async delete(id) {
    await query(`UPDATE evidence SET metadata = jsonb_set(metadata, '{deleted}', 'true') WHERE id = $1`, [id]);
  },

  async createVersion(input) {
    const parent = await this.findById(input.parentEvidenceId);
    if (!parent) throw new Error('Parent evidence not found');
    const { rows } = await query(
      `INSERT INTO evidence (case_id, uploaded_by, filename, original_filename, mime_type, size_bytes, storage_path, description, category, tags, version, parent_evidence_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        parent.caseId,
        input.uploadedBy ?? parent.uploadedBy,
        input.filename,
        input.originalFilename ?? parent.originalFilename,
        input.mimeType ?? parent.mimeType,
        input.sizeBytes ?? 0,
        input.storagePath,
        input.description ?? parent.description,
        input.category ?? parent.category,
        input.tags ?? parent.tags,
        (parent.version ?? 1) + 1,
        parent.id,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapEvidence(rows[0]);
  },

  async getVersions(parentId) {
    const { rows } = await query(`SELECT * FROM evidence WHERE parent_evidence_id = $1 ORDER BY version ASC`, [parentId]);
    return rows.map(mapEvidence);
  },
};
