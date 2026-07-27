import { query } from '../db/pool.js';
import type { WorkerProfile } from '../types/worker-platform.js';

function mapProfile(row: any): WorkerProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    siteId: row.site_id,
    departmentId: row.department_id,
    teamId: row.team_id,
    employeeId: row.employee_id,
    position: row.position,
    employmentType: row.employment_type,
    joinDate: row.join_date,
    managerId: row.manager_id,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelation: row.emergency_contact_relation,
    languages: row.languages ?? [],
    skills: row.skills ?? [],
    bio: row.bio,
    profilePhotoUrl: row.profile_photo_url,
    attendanceSummary: row.attendance_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const workerProfileRepo = {
  async findByUserId(orgId: string, userId: string): Promise<WorkerProfile | null> {
    const { rows } = await query(`SELECT * FROM worker_profiles WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
    return rows[0] ? mapProfile(rows[0]) : null;
  },

  async create(input: Partial<WorkerProfile> & { organizationId: string; userId: string }): Promise<WorkerProfile> {
    const { rows } = await query<WorkerProfile>(
      `INSERT INTO worker_profiles (organization_id, user_id, site_id, department_id, team_id, employee_id, position, employment_type, join_date, manager_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, languages, skills, bio, profile_photo_url, attendance_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.teamId ?? null,
        input.employeeId ?? null,
        input.position ?? null,
        input.employmentType ?? null,
        input.joinDate ?? null,
        input.managerId ?? null,
        input.emergencyContactName ?? null,
        input.emergencyContactPhone ?? null,
        input.emergencyContactRelation ?? null,
        input.languages ?? [],
        input.skills ?? [],
        input.bio ?? null,
        input.profilePhotoUrl ?? null,
        input.attendanceSummary ?? {},
      ],
    );
    return mapProfile(rows[0]);
  },

  async update(orgId: string, userId: string, patch: Partial<WorkerProfile>): Promise<WorkerProfile | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.teamId !== undefined) set('team_id', patch.teamId);
    if (patch.employeeId !== undefined) set('employee_id', patch.employeeId);
    if (patch.position !== undefined) set('position', patch.position);
    if (patch.employmentType !== undefined) set('employment_type', patch.employmentType);
    if (patch.joinDate !== undefined) set('join_date', patch.joinDate);
    if (patch.managerId !== undefined) set('manager_id', patch.managerId);
    if (patch.emergencyContactName !== undefined) set('emergency_contact_name', patch.emergencyContactName);
    if (patch.emergencyContactPhone !== undefined) set('emergency_contact_phone', patch.emergencyContactPhone);
    if (patch.emergencyContactRelation !== undefined) set('emergency_contact_relation', patch.emergencyContactRelation);
    if (patch.languages !== undefined) set('languages', patch.languages);
    if (patch.skills !== undefined) set('skills', patch.skills);
    if (patch.bio !== undefined) set('bio', patch.bio);
    if (patch.profilePhotoUrl !== undefined) set('profile_photo_url', patch.profilePhotoUrl);
    if (patch.attendanceSummary !== undefined) set('attendance_summary', JSON.stringify(patch.attendanceSummary));
    if (!sets.length) return this.findByUserId(orgId, userId);
    sets.push(`updated_at = now()`);
    params.push(orgId, userId);
    const { rows } = await query(`UPDATE worker_profiles SET ${sets.join(', ')} WHERE organization_id = $${i - 1} AND user_id = $${i} RETURNING *`, params);
    return rows[0] ? mapProfile(rows[0]) : null;
  },

  async listByOrganization(orgId: string, departmentId?: string, siteId?: string): Promise<WorkerProfile[]> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (departmentId) { conditions.push(`department_id = $${idx++}`); params.push(departmentId); }
    if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
    const { rows } = await query(`SELECT * FROM worker_profiles WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    return rows.map(mapProfile);
  },
};
