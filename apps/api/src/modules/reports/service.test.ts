import { describe, expect, it, vi } from 'vitest';

import { reportsService } from './service.js';

vi.mock('../../core/audit.js', () => ({ audit: vi.fn(async () => undefined) }));
vi.mock('../../db/pool.js', () => ({ query: vi.fn(async () => ({ rows: [] })) }));

describe('reportsService', () => {
  it('generates a ready report result for supported exports', async () => {
    const result = await reportsService.generate({ organizationId: 'org-1', userId: 'user-1', type: 'executive', format: 'pdf', title: 'Executive summary' });

    expect(result.status).toBe('ready');
    expect(result.format).toBe('pdf');
    expect(result.summary).toContain('Executive summary');
  });

  it('lists templates for an organization', async () => {
    const templates = await reportsService.listTemplates('org-1');
    expect(Array.isArray(templates)).toBe(true);
  });
});
