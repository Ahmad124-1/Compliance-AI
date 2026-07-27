import { roleRepo, permissionRepo, permissionGroupRepo } from '../repositories/rbac.repo.js';
import type { Permission, Role } from '../types/index.js';

/**
 * Resolves flattened permissions for a set of roles within an organization.
 */
async function resolvePermissions(roles: Role[]): Promise<Permission[]> {
  const perms = new Map<string, Permission>();
  for (const role of roles) {
    const rolePerms = await roleRepo.permissionsForRole(role.id);
    for (const p of rolePerms) perms.set(p.key, p);
  }
  return [...perms.values()];
}

export const rbacService = {
  resolvePermissions,

  /**
   * Build a permission check helper bound to a user's permission set.
   */
  checker(permissionKeys: string[]) {
    const set = new Set(permissionKeys);
    return {
      has(key: string): boolean {
        return set.has(key);
      },
      hasAny(keys: string[]): boolean {
        return keys.some((k) => set.has(k));
      },
      hasAll(keys: string[]): boolean {
        return keys.every((k) => set.has(k));
      },
    };
  },

  async ensureSeeded(): Promise<void> {
    const existing = await permissionRepo.list();
    if (existing.length) return;
    const catalogue = buildPermissionCatalogue();
    for (const p of catalogue) await permissionRepo.create(p);
  },

  async groups() {
    return permissionGroupRepo.list();
  },
};

export interface PermissionCatalogueItem {
  key: string;
  resource: string;
  action: string;
  description: string;
}

/**
 * Full platform permission catalogue.
 */
export function buildPermissionCatalogue(): PermissionCatalogueItem[] {
const resources = ['org', 'site', 'department', 'team', 'user', 'role', 
'permission', 'profile', 'standard', 'framework', 'grievance', 'case', 'investigation', 'evidence', 'witness', 
'interview', 'finding', 'root_cause', 'resolution', 'escalation', 'risk', 'ai', 'audit', 'search', 'notification', 
'sla', 'queue', 'qr', 'template', 'communication', 'analytics', 'assessment', 'engagement', 'survey', 'recognition', 
'wellbeing', 'community', 'event', 'sustainability', 'environment'];
  const actions = ['read', 'create', 'update', 'delete', 'assign'];
  const items: PermissionCatalogueItem[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      items.push({
        key: `${resource}:${action}`,
        resource,
        action,
        description: `${action} ${resource}`,
      });
    }
  }
  items.push({ key: 'user:invite', resource: 'user', action: 'invite', description: 'invite user' });
  return items;
}
