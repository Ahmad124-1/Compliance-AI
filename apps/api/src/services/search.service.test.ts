import { describe, expect, it, vi, beforeEach } from 'vitest';

import { searchService } from './search.service.js';

vi.mock('../repositories/search.repo.js', () => {
  const hits = [
    {
      id: 'c1',
      scope: 'complaints',
      title: 'Unpaid wages',
      subtitle: 'Factory A',
      status: 'pending',
      priority: 'high',
      category: 'wages',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      url: '/track-grievance?n=ABC',
      metadata: { trackingNumber: 'ABC' },
    },
  ];
  return {
    searchRepo: { search: vi.fn(async () => ({ hits, total: 1 })) },
    savedSearchRepo: {
      create: vi.fn(async (i: any) => ({ ...i, id: 's1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
      list: vi.fn(async () => []),
      remove: vi.fn(async () => undefined),
    },
    recentSearchRepo: {
      list: vi.fn(async () => []),
      record: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined),
    },
  };
});

vi.mock('../repositories/organization.repo.js', () => ({
  organizationRepo: { findById: vi.fn(async () => ({ id: 'org-1' })) },
}));

vi.mock('../core/audit.js', () => ({
  audit: vi.fn(async () => undefined),
}));

describe('searchService.globalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hits and total for a term', async () => {
    const res = await searchService.globalSearch({ organizationId: 'org-1', userId: 'u1', term: 'wages', record: true });
    expect(res.total).toBe(1);
    expect(res.hits[0].scope).toBe('complaints');
  });
});

describe('searchService.saved + recent', () => {
  it('saves a named search', async () => {
    const saved = await searchService.save('org-1', 'u1', { name: 'My search', scope: 'all', query: 'wages' });
    expect(saved.id).toBe('s1');
  });

  it('deletes a saved search without error', async () => {
    await expect(searchService.deleteSaved('org-1', 'u1', 's1')).resolves.toBeUndefined();
  });
});
