import { query } from '../db/pool.js';
import type { Permission, PermissionGroup, Role } from '../types/index.js';

function mapPermission(row: any): Permission {
  return {
    id: row.id,
    key: row.key,
    resource: row.resource,
    action: row.action,
    description: row.description,
  };
}

function mapGroup(row: any): PermissionGroup {
  return { id: row.id, name: row.name, description: row.description };
}

function mapRole(row: any): Role {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    key: row.key,
    description: row.description,
    isSystem: row.is_system,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const permissionRepo = {
  async list(): Promise<Permission[]> {
    const { rows } = await query(`SELECT * FROM permissions ORDER BY resource, action`);
    return rows.map(mapPermission);
  },
  async listByKeys(keys: string[]): Promise<Permission[]> {
    if (!keys.length) return [];
    const { rows } = await query(`SELECT * FROM permissions WHERE key = ANY($1)`, [keys]);
    return rows.map(mapPermission);
  },
  async create(input: Omit<Permission, 'id'>): Promise<Permission> {
    const { rows } = await query<Permission>(
      `INSERT INTO permissions (key, resource, action, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.key, input.resource, input.action, input.description ?? null],
    );
    return mapPermission(rows[0]);
  },
  async seedMany(items: Omit<Permission, 'id'>[]): Promise<void> {
    for (const it of items) {
      await query(
        `INSERT INTO permissions (key, resource, action, description) VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) DO NOTHING`,
        [it.key, it.resource, it.action, it.description ?? null],
      );
    }
  },
};

export const permissionGroupRepo = {
  async list(): Promise<PermissionGroup[]> {
    const { rows } = await query(`SELECT * FROM permission_groups ORDER BY name`);
    return rows.map(mapGroup);
  },
  async create(name: string, description?: string | null): Promise<PermissionGroup> {
    const { rows } = await query<PermissionGroup>(
      `INSERT INTO permission_groups (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description ?? null],
    );
    return mapGroup(rows[0]);
  },
  async addPermission(groupId: string, permissionId: string): Promise<void> {
    await query(
      `INSERT INTO permission_group_items (group_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [groupId, permissionId],
    );
  },
  async permissionsForGroup(groupId: string): Promise<Permission[]> {
    const { rows } = await query(
      `SELECT p.* FROM permissions p
       JOIN permission_group_items i ON i.permission_id = p.id
       WHERE i.group_id = $1`,
      [groupId],
    );
    return rows.map(mapPermission);
  },
};

export const roleRepo = {
  async create(
    orgId: string,
    name: string,
    key: string,
    opts: { description?: string | null; isSystem?: boolean } = {},
  ): Promise<Role> {
    const { rows } = await query<Role>(
      `INSERT INTO roles (organization_id, name, key, description, is_system)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orgId, name, key, opts.description ?? null, opts.isSystem ?? false],
    );
    return mapRole(rows[0]);
  },
  async findByKey(orgId: string, key: string): Promise<Role | null> {
    const { rows } = await query(`SELECT * FROM roles WHERE organization_id = $1 AND key = $2`, [orgId, key]);
    return rows[0] ? mapRole(rows[0]) : null;
  },
  async findById(id: string): Promise<Role | null> {
    const { rows } = await query(`SELECT * FROM roles WHERE id = $1`, [id]);
    return rows[0] ? mapRole(rows[0]) : null;
  },
  async listByOrganization(orgId: string): Promise<Role[]> {
    const { rows } = await query(`SELECT * FROM roles WHERE organization_id = $1 AND is_active = TRUE ORDER BY name`, [orgId]);
    return rows.map(mapRole);
  },
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [roleId, permissionId],
    );
  },
  async assignGroup(roleId: string, groupId: string): Promise<void> {
    await query(
      `INSERT INTO role_permission_groups (role_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [roleId, groupId],
    );
  },
  async permissionsForRole(roleId: string): Promise<Permission[]> {
    const { rows } = await query(
      `SELECT DISTINCT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1
       UNION
       SELECT DISTINCT p.* FROM permissions p
       JOIN role_permission_groups rg ON rg.group_id = p.id
       JOIN permission_group_items i ON i.group_id = rg.group_id
       WHERE rg.role_id = $1`,
      [roleId],
    );
    return rows.map(mapPermission);
  },
};
