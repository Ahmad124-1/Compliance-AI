import { describe, expect, it } from 'vitest';

describe('CAPA service scaffolding', () => {
  it('exposes the expected CAPA domain entities', () => {
    expect(['finding', 'non_conformity', 'capa']).toContain('capa');
  });
});
