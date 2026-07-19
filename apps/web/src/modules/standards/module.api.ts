import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { STANDARDS_ENDPOINTS } from './module.constants.js';
import type {
  Standard,
  Framework,
  Clause,
  Requirement,
  Control,
  OrganizationFramework,
  FrameworkAssignment,
  FrameworkProgress,
  StandardsDashboard,
  SearchResult,
  AssignmentScope,
  ControlStatusState,
} from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const standardsApi = {
  // Standards
  list: (params: { search?: string; category?: string; activeOnly?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    if (params.activeOnly) qs.set('activeOnly', 'true');
    const q = qs.toString();
    return http<Standard[]>(`${STANDARDS_ENDPOINTS.standards}${q ? `?${q}` : ''}`);
  },
  dashboard: () => http<StandardsDashboard>(STANDARDS_ENDPOINTS.dashboard),
  create: (dto: Partial<Standard>) => http<Standard>(STANDARDS_ENDPOINTS.standards, { method: 'POST', body: JSON.stringify(dto) }),
  get: (id: string) => http<Standard>(`${STANDARDS_ENDPOINTS.standards}/${id}`),
  frameworksFor: (id: string) => http<Framework[]>(`${STANDARDS_ENDPOINTS.standards}/${id}/frameworks`),
  update: (id: string, dto: Partial<Standard>) => http<Standard>(`${STANDARDS_ENDPOINTS.standards}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // Frameworks
  listFrameworks: () => http<Framework[]>(STANDARDS_ENDPOINTS.frameworks),
  getFramework: (id: string) => http<Framework>(`${STANDARDS_ENDPOINTS.frameworks}/${id}`),
  clauseTree: (id: string) => http<Clause[]>(`${STANDARDS_ENDPOINTS.frameworks}/${id}/clause-tree`),
  categories: (id: string) => http(`${STANDARDS_ENDPOINTS.frameworks}/${id}/categories`),
  requirements: (id: string, params: { search?: string; categoryId?: string; clauseId?: string; mandatory?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.clauseId) qs.set('clauseId', params.clauseId);
    if (params.mandatory !== undefined) qs.set('mandatory', String(params.mandatory));
    const q = qs.toString();
    return http<Requirement[]>(`${STANDARDS_ENDPOINTS.frameworks}/${id}/requirements${q ? `?${q}` : ''}`);
  },
  controlsForRequirement: (frameworkId: string, reqId: string) =>
    http<Control[]>(`${STANDARDS_ENDPOINTS.frameworks}/${frameworkId}/requirements/${reqId}/controls`),

  // Adoption
  listAdopted: () => http<OrganizationFramework[]>(STANDARDS_ENDPOINTS.organizationFrameworks),
  enable: (frameworkId: string) => http<OrganizationFramework>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/enable`, { method: 'POST', body: JSON.stringify({ frameworkId }) }),
  disable: (id: string) => http<OrganizationFramework>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/disable`, { method: 'POST' }),
  settings: (id: string, dto: Record<string, unknown>) => http<OrganizationFramework>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/settings`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // Assignments
  listAssignments: (id: string) => http<FrameworkAssignment[]>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/assignments`),
  addAssignment: (id: string, scope: AssignmentScope, siteId?: string | null, departmentId?: string | null) =>
    http<FrameworkAssignment>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/assignments`, { method: 'POST', body: JSON.stringify({ scope, siteId, departmentId }) }),
  removeAssignment: (id: string, assignId: string) => http(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/assignments/${assignId}`, { method: 'DELETE' }),

  // Applicability
  setApplicability: (id: string, reqId: string, applicable: boolean, notes?: string | null) =>
    http(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/requirements/${reqId}/applicability`, { method: 'POST', body: JSON.stringify({ applicable, notes }) }),

  // Control status
  controlStatuses: (id: string) => http(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/control-status`),
  setControlStatus: (id: string, controlId: string, status: ControlStatusState, ownerId?: string | null, notes?: string | null) =>
    http(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/controls/${controlId}/status`, { method: 'POST', body: JSON.stringify({ status, ownerId, notes }) }),

  // Progress
  progress: (id: string) => http<FrameworkProgress>(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/progress`),
  compliance: (id: string) => http(`${STANDARDS_ENDPOINTS.organizationFrameworks}/${id}/compliance`),

  // Search
  search: (q: string) => http<SearchResult>(`${STANDARDS_ENDPOINTS.search}?q=${encodeURIComponent(q)}`),
};
