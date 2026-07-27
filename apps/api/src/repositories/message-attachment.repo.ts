import { query } from '../db/pool.js';

function mapMessageAttachment(row: any) {
  return {
    id: row.id,
    messageId: row.message_id,
    organizationId: row.organization_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    fileUrl: row.file_url,
    thumbnailUrl: row.thumbnail_url,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export const messageAttachmentRepo = {
  async create(input: { messageId: string; organizationId: string; fileName: string; fileType?: string; fileSize?: number; fileUrl: string; thumbnailUrl?: string }) {
    const { rows } = await query(
      `INSERT INTO message_attachments (message_id, organization_id, file_name, file_type, file_size, file_url, thumbnail_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [input.messageId, input.organizationId, input.fileName, input.fileType ?? null, input.fileSize ?? null, input.fileUrl, input.thumbnailUrl ?? null],
    );
    return mapMessageAttachment(rows[0]);
  },

  async listByMessage(messageId: string) {
    const { rows } = await query(`SELECT * FROM message_attachments WHERE message_id = $1 ORDER BY created_at ASC`, [messageId]);
    return rows.map(mapMessageAttachment);
  },

  async delete(id: string) {
    await query(`DELETE FROM message_attachments WHERE id = $1`, [id]);
  },
};
