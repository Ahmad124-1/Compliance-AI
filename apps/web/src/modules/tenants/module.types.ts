/**
 * Tenant (multi-tenant hierarchy) module types.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: 'consultancy' | 'client';
  logoUrl: string | null;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  address: Record<string, unknown> | null;
  isActive: boolean;
}

export interface Department {
  id: string;
  organizationId: string;
  siteId: string | null;
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface Team {
  id: string;
  organizationId: string;
  departmentId: string | null;
  name: string;
  code: string | null;
  isActive: boolean;
}

export type {
  CreateOrganizationInput,
  CreateSiteInput,
  CreateDepartmentInput,
  CreateTeamInput,
} from './module.validation.js';
