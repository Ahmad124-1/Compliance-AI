import { query } from '../../../db/pool.js';
import type { Grievance, GrievanceSource, GrievanceStatus, GrievanceSeverity, GrievanceUpdateInput } from '../types.js';

function mapGrievance(row: any): Grievance {
  return {
    id: row.id,
    organizationId: row.organization_id,
    trackingNumber: row.tracking_number,
    trackingPIN: row.tracking_pin,
    source: row.source,
    category: row.category,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    language: row.language,
    anonymous: row.anonymous,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    reporterPhone: row.reporter_phone,
    factory: row.factory,
    department: row.department,
    location: row.location,
    severity: row.severity,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GrievanceCreateInput {
  organizationId: string;
  source: GrievanceSource;
  category: string;
  title: string;
  description: string;
  language?: string;
  anonymous?: boolean;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  factory?: string | null;
  department?: string | null;
  location?: string | null;
  severity?: GrievanceSeverity | null;
  metadata?: Record<string, unknown>;
}

export const grievanceRepo = {
  async create(input: GrievanceCreateInput & { trackingNumber: string; trackingPIN: string }): Promise<Grievance> {
    const { rows } = await query<Grievance>(
      `INSERT INTO grievances (
         organization_id, tracking_number, tracking_pin, source, category, title, description,
         language, anonymous, reporter_name, reporter_email, reporter_phone, factory, department, location, severity, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        input.organizationId,
        input.trackingNumber,
        input.trackingPIN,
        input.source,
        input.category,
        input.title,
        input.description,
        input.language ?? 'en',
        input.anonymous ?? true,
        input.reporterName ?? null,
        input.reporterEmail ?? null,
        input.reporterPhone ?? null,
        input.factory ?? null,
        input.department ?? null,
        input.location ?? null,
        input.severity ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapGrievance(rows[0]);
  },

  async findById(id: string): Promise<Grievance | null> {
    const { rows } = await query(`SELECT * FROM grievances WHERE id = $1`, [id]);
    return rows[0] ? mapGrievance(rows[0]) : null;
  },

  async findByTrackingNumber(trackingNumber: string): Promise<Grievance | null> {
    const { rows } = await query(`SELECT * FROM grievances WHERE tracking_number = $1`, [trackingNumber]);
    return rows[0] ? mapGrievance(rows[0]) : null;
  },

  async findByTrackingNumberAndPIN(trackingNumber: string, pin: string): Promise<Grievance | null> {
    const { rows } = await query(`SELECT * FROM grievances WHERE tracking_number = $1 AND tracking_pin = $2`, [trackingNumber, pin]);
    return rows[0] ? mapGrievance(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: { status?: GrievanceStatus; category?: string; source?: string } = {}): Promise<Grievance[]> {
    const where: string[] = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.category) { where.push(`category = $${i++}`); params.push(filter.category); }
    if (filter.source) { where.push(`source = $${i++}`); params.push(filter.source); }
    const { rows } = await query(`SELECT * FROM grievances WHERE ${where.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapGrievance);
  },

  async update(id: string, patch: GrievanceUpdateInput): Promise<Grievance | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE grievances SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapGrievance(rows[0]) : null;
  },
};

export { attachmentRepo } from './attachment.repo.js';
