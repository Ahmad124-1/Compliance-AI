import { query } from '../../../db/pool.js';
import type { GrievanceAttachment } from '../types.js';

function mapAttachment(row: any): GrievanceAttachment {
  return {
    id: row.id,
    grievanceId: row.grievance_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

export interface AttachmentCreateInput {
  grievanceId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export const attachmentRepo = {
  async create(input: AttachmentCreateInput): Promise<GrievanceAttachment> {
    const { rows } = await query<GrievanceAttachment>(
      `INSERT INTO grievance_attachments (grievance_id, filename, mime_type, size_bytes, storage_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.grievanceId, input.filename, input.mimeType, input.sizeBytes, input.storagePath],
    );
    return mapAttachment(rows[0]);
  },

  async findByGrievance(grievanceId: string): Promise<GrievanceAttachment[]> {
    const { rows } = await query(`SELECT * FROM grievance_attachments WHERE grievance_id = $1 ORDER BY created_at`, [grievanceId]);
    return rows.map(mapAttachment);
  },

  async delete(id: string): Promise<void> {
    await query(`DELETE FROM grievance_attachments WHERE id = $1`, [id]);
  },
};
