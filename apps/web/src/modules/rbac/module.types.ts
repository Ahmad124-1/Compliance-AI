/**
 * RBAC module types (mirror API responses).
 */
export interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  permissions?: Permission[];
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export type { CreateRoleInput, CreateGroupInput } from './module.validation.js';
