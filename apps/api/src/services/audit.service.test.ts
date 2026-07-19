import { describe, expect, it, vi, beforeEach } from 'vitest';

import { auditService } from './audit.service.js';

vi.mock('../repositories/audit.repo.js', () => ({
  auditRepo: {
    list: vi.fn(async () => ({ logs: [{ id: 'a1', organizationId: 'org-1', createdAt: new Date().toISOString(), metadata: {} }], total: 1 })),
    get: vi.fn(async () => ({ id: 'a1', organizationId: 'org-1', createdAt: new Date().toISOString(), metadata: {} })),
    actions: vi.fn(async () => ['complaint.created', 'qr.generated']),
    export: vi.fn(async () => [{ id: 'a1', organizationId: 'org-1', createdAt: new Date().toISOString(), metadata: {} }]),
  },
}));

vi.mock('../repositories/organization.repo.js', () => ({
  organizationRepo: { findById: vi.fn(async () => ({ id: 'org-1' })) },
}));

describe('auditService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists logs with total', async () => {
    const res = await auditService.list('org-1', { limit: 10 });
    expect(res.total).toBe(1);
    expect(res.logs[0].id).toBe('a1');
  });

  it('returns distinct actions', async () => {
    const actions = await auditService.actions('org-1');
    expect(actions).toContain('complaint.created');
  });

  it('exports logs', async () => {
    const logs = await auditService.exportLogs('org-1', {});
    expect(logs.length).toBe(1);
  });
});
