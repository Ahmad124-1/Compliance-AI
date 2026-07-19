import { query } from '../db/pool.js';

/** @type {any} */
const mapInterview = (row) => ({
  id: row.id,
  caseId: row.case_id,
  witnessId: row.witness_id,
  interviewerId: row.interviewer_id,
  type: row.type,
  location: row.location,
  scheduledAt: row.scheduled_at,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  summary: row.summary,
  transcript: row.transcript,
  recordingPath: row.recording_path,
  findings: row.findings,
  isConfidential: row.is_confidential,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const interviewRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO interviews (case_id, witness_id, interviewer_id, type, location, scheduled_at, started_at, completed_at, summary, transcript, recording_path, findings, is_confidential, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.caseId,
        input.witnessId ?? null,
        input.interviewerId,
        input.type ?? 'verbal',
        input.location ?? null,
        input.scheduledAt ?? null,
        input.startedAt ?? null,
        input.completedAt ?? null,
        input.summary,
        input.transcript ?? null,
        input.recordingPath ?? null,
        input.findings ?? null,
        input.isConfidential ?? true,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapInterview(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM interviews WHERE id = $1`, [id]);
    return rows[0] ? mapInterview(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM interviews WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapInterview);
  },

  async findByInterviewerId(interviewerId) {
    const { rows } = await query(`SELECT * FROM interviews WHERE interviewer_id = $1 ORDER BY created_at DESC`, [interviewerId]);
    return rows.map(mapInterview);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.witnessId !== undefined) set('witness_id', patch.witnessId);
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.location !== undefined) set('location', patch.location);
    if (patch.scheduledAt !== undefined) set('scheduled_at', patch.scheduledAt);
    if (patch.startedAt !== undefined) set('started_at', patch.startedAt);
    if (patch.completedAt !== undefined) set('completed_at', patch.completedAt);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.transcript !== undefined) set('transcript', patch.transcript);
    if (patch.recordingPath !== undefined) set('recording_path', patch.recordingPath);
    if (patch.findings !== undefined) set('findings', patch.findings);
    if (patch.isConfidential !== undefined) set('is_confidential', patch.isConfidential);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE interviews SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapInterview(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM interviews WHERE id = $1`, [id]);
  },
};
