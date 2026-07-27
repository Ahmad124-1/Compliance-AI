import { query } from '../db/pool.js';
import type { WorkerDirectoryEntry } from '../types/worker-platform.js';

function mapDir(row: any): WorkerDirectoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    siteName: row.site_name,
    departmentName: row.department_name,
    teamName: row.team_name,
    position: row.position,
    employeeId: row.employee_id,
    managerName: row.manager_name,
    languages: row.languages ?? [],
    skills: row.skills ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

export const workerDirectoryRepo = {
  async search(orgId: string, params: { departmentId?: string; siteId?: string; role?: string; skill?: string; managerId?: string; query?: string }): Promise<WorkerDirectoryEntry[]> {
    const conditions: string[] = ['wp.organization_id = $1'];
    const values: unknown[] = [orgId];
    let idx = 2;
    if (params.departmentId) { conditions.push(`wp.department_id = $${idx++}`); values.push(params.departmentId); }
    if (params.siteId) { conditions.push(`wp.site_id = $${idx++}`); values.push(params.siteId); }
    if (params.skill) { conditions.push(`$${idx++} = ANY(wp.skills)`); values.push(params.skill); }
    if (params.managerId) { conditions.push(`wp.manager_id = $${idx++}`); values.push(params.managerId); }
    if (params.query) {
      conditions.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx} OR wp.position ILIKE $${idx})`);
      values.push(`%${params.query}%`);
      idx++;
    }
    const sql = `
      SELECT wp.id, wp.organization_id, wp.user_id, u.email, u.first_name, u.last_name, u.avatar_url,
             s.name AS site_name, d.name AS department_name, t.name AS team_name,
             wp.position, wp.employee_id, m.first_name || ' ' || m.last_name AS manager_name,
             wp.languages, wp.skills, u.status, wp.created_at
      FROM worker_profiles wp
      JOIN users u ON u.id = wp.user_id
      LEFT JOIN sites s ON s.id = wp.site_id
      LEFT JOIN departments d ON d.id = wp.department_id
      LEFT JOIN teams t ON t.id = wp.team_id
      LEFT JOIN users m ON m.id = wp.manager_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.first_name ASC NULLS LAST
    `;
    const { rows } = await query(sql, values);
    return rows.map(mapDir);
  },
};
