import { query } from '../db/pool.js';
import type { Role, User, UserStatus } from '../types/index.js';

function mapUser(row: any): User {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    locale: row.locale,
    preferences: row.preferences,
    status: row.status,
    emailVerified: row.email_verified,
    emailVerificationExpiresAt: row.email_verification_expires_at ?? null,
    passwordResetExpiresAt: row.password_reset_expires_at ?? null,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface UserCreateInput {
  organizationId: string;
  email: string;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: UserStatus;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
}

export const userRepo = {
  async create(input: UserCreateInput): Promise<User> {
    const { rows } = await query<User>(
      `INSERT INTO users (
         organization_id, email, password_hash, first_name, last_name, status,
         email_verified, email_verification_token, email_verification_expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.email,
        input.passwordHash ?? null,
        input.firstName ?? null,
        input.lastName ?? null,
        input.status ?? 'invited',
        input.emailVerified ?? false,
        input.emailVerificationToken ?? null,
        input.emailVerificationExpiresAt ?? null,
      ],
    );
    return mapUser(rows[0]);
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findByVerificationToken(token: string): Promise<User | null> {
    const { rows } = await query(`SELECT * FROM users WHERE email_verification_token = $1`, [token]);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findByResetToken(token: string): Promise<User | null> {
    const { rows } = await query(`SELECT * FROM users WHERE password_reset_token = $1`, [token]);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async listByOrganization(orgId: string): Promise<User[]> {
    const { rows } = await query(`SELECT * FROM users WHERE organization_id = $1 ORDER BY created_at DESC`, [orgId]);
    return rows.map(mapUser);
  },

  async update(
    id: string,
    patch: Partial<{
      passwordHash: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      locale: string;
      preferences: Record<string, unknown>;
      status: UserStatus;
      emailVerified: boolean;
      emailVerificationToken: string | null;
      emailVerificationExpiresAt: Date | null;
      passwordResetToken: string | null;
      passwordResetExpiresAt: Date | null;
      lastLoginAt: Date | null;
    }>,
  ): Promise<User | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.passwordHash !== undefined) set('password_hash', patch.passwordHash);
    if (patch.firstName !== undefined) set('first_name', patch.firstName);
    if (patch.lastName !== undefined) set('last_name', patch.lastName);
    if (patch.avatarUrl !== undefined) set('avatar_url', patch.avatarUrl);
    if (patch.locale !== undefined) set('locale', patch.locale);
    if (patch.preferences !== undefined) set('preferences', JSON.stringify(patch.preferences));
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.emailVerified !== undefined) set('email_verified', patch.emailVerified);
    if (patch.emailVerificationToken !== undefined) set('email_verification_token', patch.emailVerificationToken);
    if (patch.emailVerificationExpiresAt !== undefined) set('email_verification_expires_at', patch.emailVerificationExpiresAt);
    if (patch.passwordResetToken !== undefined) set('password_reset_token', patch.passwordResetToken);
    if (patch.passwordResetExpiresAt !== undefined) set('password_reset_expires_at', patch.passwordResetExpiresAt);
    if (patch.lastLoginAt !== undefined) set('last_login_at', patch.lastLoginAt);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async assignRole(userId: string, roleId: string, orgId: string, assignedBy?: string | null): Promise<void> {
    await query(
      `INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [userId, roleId, orgId, assignedBy ?? null],
    );
  },

  async unassignRole(userId: string, roleId: string, orgId: string): Promise<void> {
    await query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 AND organization_id = $3`,
      [userId, roleId, orgId],
    );
  },

  async getUserRoles(userId: string, orgId: string): Promise<Role[]> {
    const { rows } = await query<{
      id: string;
      organization_id: string;
      name: string;
      key: string;
      description: string | null;
      is_system: boolean;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT r.* FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.organization_id = $2 AND r.is_active = TRUE`,
      [userId, orgId],
    );
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      key: r.key,
      description: r.description,
      isSystem: r.is_system,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async addMembership(
    userId: string,
    orgId: string,
    scope: { siteId?: string | null; departmentId?: string | null; teamId?: string | null },
  ): Promise<void> {
    await query(
      `INSERT INTO user_memberships (user_id, organization_id, site_id, department_id, team_id)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [userId, orgId, scope.siteId ?? null, scope.departmentId ?? null, scope.teamId ?? null],
    );
  },
};
