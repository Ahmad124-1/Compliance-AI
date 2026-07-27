import { query } from '../db/pool.js';
import type { EsgReportingPeriod } from '../types/esg.js';

function mapPeriod(row: any): EsgReportingPeriod {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    periodType: row.period_type,
    startDate: row.start_date,
    endDate: row.end_date,
    dueDate: row.due_date,
    status: row.status,
    frameworks: row.frameworks ?? [],
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PeriodFilter {
  status?: string;
  periodType?: string;
}

export const esgReportingPeriodRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    periodType: string;
    startDate: string;
    endDate: string;
    dueDate: string;
    frameworks?: string[];
  }): Promise<EsgReportingPeriod> {
    const { rows } = await query<EsgReportingPeriod>(
      `INSERT INTO esg_reporting_periods (organization_id, name, period_type, start_date, end_date, due_date, frameworks)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.periodType,
        input.startDate,
        input.endDate,
        input.dueDate,
        input.frameworks ?? [],
      ],
    );
    return mapPeriod(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgReportingPeriod | null> {
    const { rows } = await query<EsgReportingPeriod>(
      `SELECT * FROM esg_reporting_periods WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapPeriod(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: PeriodFilter = {}): Promise<EsgReportingPeriod[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.periodType) {
      where.push(`period_type = $${i++}`);
      params.push(filter.periodType);
    }
    const { rows } = await query<EsgReportingPeriod>(
      `SELECT * FROM esg_reporting_periods WHERE ${where.join(' AND ')} ORDER BY start_date DESC`,
      params,
    );
    return rows.map(mapPeriod);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgReportingPeriod, 'name' | 'status' | 'dueDate' | 'frameworks'>>): Promise<EsgReportingPeriod | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.frameworks !== undefined) set('frameworks', patch.frameworks);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgReportingPeriod>(
      `UPDATE esg_reporting_periods SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapPeriod(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_reporting_periods SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
