import { query } from '../../../db/pool.js';
import type { AuditRecord, AuditSectionRecord, AuditQuestionResponseRecord } from '../types.js';

export const auditRepo = {
  async list(organizationId: string): Promise<AuditRecord[]> {
    const { rows } = await query<AuditRecord>(`SELECT * FROM audits WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows;
  },

  async getById(id: string): Promise<AuditRecord | null> {
    const { rows } = await query<AuditRecord>(`SELECT * FROM audits WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async listSections(auditId: string): Promise<AuditSectionRecord[]> {
    const { rows } = await query<AuditSectionRecord>(`SELECT * FROM audit_sections WHERE audit_id = $1 ORDER BY position`, [auditId]);
    return rows;
  },

  async listResponses(auditId: string): Promise<AuditQuestionResponseRecord[]> {
    const { rows } = await query<AuditQuestionResponseRecord>(`SELECT * FROM audit_question_responses WHERE audit_id = $1 ORDER BY created_at`, [auditId]);
    return rows;
  },
};
