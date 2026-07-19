/**
 * Standards & Framework engine domain types (mirror API responses).
 */
export type StandardCategory = 'quality' | 'environment' | 'social' | 'energy' | 'esg' | 'custom';
export type FrameworkStatus = 'draft' | 'published' | 'deprecated';
export type ControlStatusState = 'not_started' | 'in_progress' | 'implemented' | 'not_applicable';
export type ComplianceState = 'pending' | 'in_progress' | 'compliant' | 'not_applicable';
export type AssignmentScope = 'organization' | 'site' | 'department';

export interface Standard {
  id: string;
  name: string;
  code: string;
  description: string | null;
  publisher: string | null;
  category: StandardCategory | null;
  isBuiltin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Framework {
  id: string;
  standardId: string;
  version: string;
  title: string;
  description: string | null;
  status: FrameworkStatus;
  publishedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Clause {
  id: string;
  frameworkId: string;
  parentId: string | null;
  categoryId: string | null;
  code: string | null;
  title: string;
  description: string | null;
  position: number;
  children?: Clause[];
}

export interface Requirement {
  id: string;
  frameworkId: string;
  clauseId: string | null;
  categoryId: string | null;
  code: string | null;
  title: string;
  description: string | null;
  mandatory: boolean;
  position: number;
}

export interface Control {
  id: string;
  requirementId: string;
  title: string;
  description: string | null;
  controlType: string | null;
  position: number;
}

export interface OrganizationFramework {
  id: string;
  organizationId: string;
  frameworkId: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  adoptedAt: string;
  adoptedBy: string | null;
}

export interface FrameworkAssignment {
  id: string;
  organizationFrameworkId: string;
  scope: AssignmentScope;
  siteId: string | null;
  departmentId: string | null;
  createdAt: string;
}

export interface FrameworkProgress {
  totalRequirements: number;
  applicableRequirements: number;
  compliantRequirements: number;
  inProgressRequirements: number;
  pendingRequirements: number;
  notApplicableRequirements: number;
  progress: number;
  byCategory: { categoryId: string | null; name: string | null; progress: number; total: number; compliant: number }[];
}

export interface StandardsDashboard {
  totalStandards: number;
  enabledStandards: number;
  compliancePct: number;
  pendingRequirements: number;
  completedRequirements: number;
  recentlyUpdated: { id: string; name: string; code: string; updatedAt: string }[];
}

export interface SearchResult {
  frameworks: { id: string; title: string; version: string; standard_name: string; standard_code: string }[];
  requirements: { id: string; code: string | null; title: string; framework_id: string; framework_title: string }[];
  clauses: { id: string; code: string | null; title: string; framework_id: string; framework_title: string }[];
}
