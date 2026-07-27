import { query } from '../db/pool.js';
import type { WorkerDocument } from '../types/worker-platform.js';

function mapDoc(row: any): WorkerDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    downloadCount: row.download_count,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const workerDocumentRepo = {
  async findByUserId(orgId: string, userId: string): Promise<WorkerDocument[]> {
    const { rows } = await query(`SELECT * FROM worker_documents WHERE organization_id = $1 AND user_id = $2 ORDER BY created_at DESC`, [orgId, userId]);
    return rows.map(mapDoc);
  },

  async findById(orgId: string, id: string): Promise<WorkerDocument | null> {
    const { rows } = await query(`SELECT * FROM worker_documents WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapDoc(rows[0]) : null;
  },

  async create(input: Partial<WorkerDocument> & { organizationId: string; userId: string; title: string; fileUrl: string }): Promise<WorkerDocument> {
    const { rows } = await query<WorkerDocument>(
      `INSERT INTO worker_documents (organization_id, user_id, title, category, file_url, file_name, file_type, file_size, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.title,
        input.category ?? 'policy',
        input.fileUrl,
        input.fileName ?? null,
        input.fileType ?? null,
        input.fileSize ?? null,
        input.metadata ?? {},
      ],
    );
    return mapDoc(rows[0]);
  },

  async incrementDownload(orgId: string, id: string): Promise<WorkerDocument | null> {
    const { rows } = await query<WorkerDocument>(`UPDATE worker_documents SET download_count = download_count + 1, updated_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *`, [orgId, id]);
    return rows[0] ? mapDoc(rows[0]) : null;
  },
};
