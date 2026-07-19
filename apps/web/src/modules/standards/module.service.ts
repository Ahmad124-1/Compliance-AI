import { standardsApi } from './module.api.js';
import type {
  Standard,
} from './module.types.js';

export const standardsService = {
  list: (params: { search?: string; category?: string; activeOnly?: boolean } = {}) =>
    standardsApi.list(params),
  dashboard: () => standardsApi.dashboard(),
  create: (dto: Partial<Standard>) => standardsApi.create(dto),
  get: (id: string) => standardsApi.get(id),
  frameworksFor: (id: string) => standardsApi.frameworksFor(id),
  update: (id: string, dto: Partial<Standard>) => standardsApi.update(id, dto),

  listFrameworks: () => standardsApi.listFrameworks(),
  getFramework: (id: string) => standardsApi.getFramework(id),
  clauseTree: (id: string) => standardsApi.clauseTree(id),
  categories: (id: string) => standardsApi.categories(id),
  requirements: (id: string, params?: { search?: string; categoryId?: string; clauseId?: string; mandatory?: boolean }) =>
    standardsApi.requirements(id, params),
  controlsForRequirement: (frameworkId: string, reqId: string) =>
    standardsApi.controlsForRequirement(frameworkId, reqId),

  listAdopted: () => standardsApi.listAdopted(),
  enable: (frameworkId: string) => standardsApi.enable(frameworkId),
  disable: (id: string) => standardsApi.disable(id),
  settings: (id: string, dto: Record<string, unknown>) => standardsApi.settings(id, dto),

  listAssignments: (id: string) => standardsApi.listAssignments(id),
  addAssignment: (id: string, scope: 'organization' | 'site' | 'department', siteId?: string | null, departmentId?: string | null) =>
    standardsApi.addAssignment(id, scope, siteId, departmentId),
  removeAssignment: (id: string, assignId: string) => standardsApi.removeAssignment(id, assignId),

  setApplicability: (id: string, reqId: string, applicable: boolean, notes?: string | null) =>
    standardsApi.setApplicability(id, reqId, applicable, notes),

  controlStatuses: (id: string) => standardsApi.controlStatuses(id),
  setControlStatus: (id: string, controlId: string, status: 'not_started' | 'in_progress' | 'implemented' | 'not_applicable', ownerId?: string | null, notes?: string | null) =>
    standardsApi.setControlStatus(id, controlId, status, ownerId, notes),

  progress: (id: string) => standardsApi.progress(id),
  compliance: (id: string) => standardsApi.compliance(id),

  search: (q: string) => standardsApi.search(q),
};
