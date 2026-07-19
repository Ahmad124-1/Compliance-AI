import { describe, expect, it } from 'vitest';

import { buildPermissionCatalogue } from './rbac.service.js';

describe('rbac permission catalogue', () => {
  it('generates resource:action keys for all resources', () => {
    const catalogue = buildPermissionCatalogue();
    expect(catalogue.length).toBeGreaterThan(0);
    expect(catalogue.every((c) => /^[a-z_]+:(read|create|update|delete|assign|invite)$/.test(c.key))).toBe(true);
    expect(catalogue.some((c) => c.key === 'user:invite')).toBe(true);
  });
});
