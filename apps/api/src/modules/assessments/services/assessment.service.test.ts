import { describe, expect, it, vi, beforeEach } from 'vitest';

import { assessmentService } from '../services/assessment.service.js';

vi.mock('../repositories/template.repo.js', () => ({
  templateRepo: {
    create: vi.fn(async (_org: string, input: any) => ({ id: 'tpl-1', organizationId: _org, status: 'draft', version: 1, ...input })),
    findById: vi.fn(async (id: string) => (id === 'missing' ? null : { id, organizationId: 'org-1', status: 'draft', isArchived: false, version: 1, title: 'T' })),
    list: vi.fn(async () => ({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
    listSections: vi.fn(async () => []),
    listQuestions: vi.fn(async () => []),
    createVersion: vi.fn(async () => ({ id: 'v1', version: 2 })),
    update: vi.fn(async (id: string, _org: string, patch: any) => ({ id, ...patch })),
    archive: vi.fn(async (id: string) => ({ id, status: 'archived', isArchived: true })),
    restore: vi.fn(async (id: string) => ({ id, status: 'draft', isArchived: false })),
    remove: vi.fn(async () => undefined),
    createSection: vi.fn(async () => ({ id: 'sec-1' })),
    createQuestion: vi.fn(async () => ({ id: 'q-1' })),
    replaceOptions: vi.fn(async () => undefined),
    listFrameworkMappings: vi.fn(async () => []),
    replaceFrameworkMappings: vi.fn(async () => []),
    listControlMappings: vi.fn(async () => []),
    replaceControlMappings: vi.fn(async () => []),
    createCondition: vi.fn(async () => ({ id: 'c-1' })),
    createDependency: vi.fn(async (input: any) => ({ id: 'd-1', ...input })),
    listVersions: vi.fn(async () => []),
    cloneStructure: vi.fn(async () => undefined),
  },
}));

vi.mock('../repositories/assessment.repo.js', () => ({
  assessmentRepo: {
    library: vi.fn(async () => ({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
    dashboard: vi.fn(async () => ({ publishedTemplates: 0, totalTemplates: 0, totalAssessments: 0, activeAssessments: 0 })),
    create: vi.fn(async (_org: string, input: any) => ({ id: 'a-1', ...input, status: 'draft' })),
    list: vi.fn(async () => ({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
    findById: vi.fn(async (id: string) => ({ id, organizationId: 'org-1', status: 'draft' })),
    update: vi.fn(async (id: string, _org: string, patch: any) => ({ id, ...patch })),
    remove: vi.fn(async () => undefined),
    listResponses: vi.fn(async () => []),
    upsertResponse: vi.fn(async (input: any) => ({ id: 'r-1', ...input, validationStatus: 'valid' })),
    listScores: vi.fn(async () => []),
    upsertScore: vi.fn(async () => ({ id: 's-1' })),
  },
}));

vi.mock('../repositories/catalogue.repo.js', () => ({
  answerTypeRepo: { ensureBuiltins: vi.fn(async () => undefined) },
  assessmentTypeRepo: { ensureBuiltins: vi.fn(async () => undefined) },
  categoryRepo: { list: vi.fn(async () => []), create: vi.fn(async () => ({ id: 'c-1' })), update: vi.fn(async () => ({})), remove: vi.fn(async () => undefined) },
  tagRepo: { list: vi.fn(async () => []), upsert: vi.fn(async (org: string, name: string) => ({ id: 't-1', name })) },
}));

vi.mock('../../core/audit.js', () => ({ audit: vi.fn(async () => undefined) }));

describe('assessmentService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a template with defaults', async () => {
    const tpl = await assessmentService.createTemplate('org-1', { title: 'Onboarding', type: 'internal' }, 'user-1');
    expect(tpl.id).toBe('tpl-1');
    expect(tpl.status).toBe('draft');
  });

  it('throws NotFound on missing template', async () => {
    await expect(assessmentService.getTemplate('org-1', 'missing')).rejects.toThrow();
  });

  it('archives and restores a template', async () => {
    const archived = await assessmentService.archiveTemplate('org-1', 'tpl-1', 'user-1');
    expect(archived.status).toBe('archived');
    const restored = await assessmentService.restoreTemplate('org-1', 'tpl-1', 'user-1');
    expect(restored.isArchived).toBe(false);
  });

  it('creates a version draft', async () => {
    const updated = await assessmentService.createVersionDraft('org-1', 'tpl-1', 'user-1', 'bump');
    expect(updated.version).toBe(2);
  });

  it('returns library paginated result', async () => {
    const lib = await assessmentService.library('org-1', { search: 'x' });
    expect(lib.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('creates a runtime assessment from a template', async () => {
    const a = await assessmentService.createAssessment('org-1', { templateId: 'tpl-1', title: 'Audit A', type: 'internal' }, 'user-1');
    expect(a.id).toBe('a-1');
    expect(a.status).toBe('draft');
  });
});
