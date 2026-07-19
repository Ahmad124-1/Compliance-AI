import { describe, it, expect, vi, beforeEach } from 'vitest';

import { searchApi } from '@/modules/search/api.js';

const mockJson = { hits: [{ id: 'x', scope: 'complaints', title: 't', subtitle: '', status: null, priority: null, category: null, createdAt: '', updatedAt: null, url: '/', metadata: {} }], total: 1, limit: 15, offset: 0, scope: 'all' };

describe('searchApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends term and scope as query params', async () => {
    const fetchMock = vi.fn(async (_url: string) => ({ ok: true, status: 200, text: async () => JSON.stringify(mockJson), json: async () => mockJson } as Response));
    vi.stubGlobal('fetch', fetchMock);
    await searchApi.search({ term: 'wages', scope: 'complaints' });
    const calledUrl = (fetchMock as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('term=wages');
    expect(calledUrl).toContain('scope=complaints');
  });

  it('throws ApiErrorResponse on non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403, text: async () => JSON.stringify({ message: 'forbidden' }), json: async () => ({ message: 'forbidden' }) } as Response)),
    );
    await expect(searchApi.search({ term: 'x' })).rejects.toMatchObject({ status: 403 });
  });
});
