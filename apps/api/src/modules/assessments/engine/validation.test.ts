import { describe, expect, it } from 'vitest';

import { validateResponse, hasBlockingErrors } from '../engine/validation.js';
import type { ValidationRuleLike } from '../engine/validation.js';

const required: ValidationRuleLike = { id: 'r1', ruleType: 'required', severity: 'error' };
const range: ValidationRuleLike = { id: 'r2', ruleType: 'range', params: { min: 0, max: 100 }, severity: 'error', message: '0..100' };
const pattern: ValidationRuleLike = { id: 'r3', ruleType: 'pattern', params: { pattern: '^[A-Z]+$' }, severity: 'warning' };
const conditional: ValidationRuleLike = {
  id: 'r4', ruleType: 'conditional', severity: 'error',
  appliesWhen: { kind: 'leaf', questionId: 'q_gated', operator: 'equals', value: 'yes' },
};

describe('validation engine', () => {
  it('flags missing required value', () => {
    const issues = validateResponse('', [required]);
    expect(issues.length).toBe(1);
    expect(hasBlockingErrors(issues)).toBe(true);
  });

  it('passes when required is present', () => {
    expect(validateResponse('abc', [required]).length).toBe(0);
  });

  it('enforces numeric range', () => {
    expect(validateResponse(150, [range]).length).toBe(1);
    expect(validateResponse(50, [range]).length).toBe(0);
  });

  it('enforces regex pattern as warning', () => {
    const issues = validateResponse('abc', [pattern]);
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe('warning');
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('skips conditional rule when condition is false', () => {
    expect(validateResponse('', [conditional], { q_gated: 'no' }).length).toBe(0);
    expect(validateResponse('', [conditional], { q_gated: 'yes' }).length).toBe(1);
  });

  it('ignores inactive rules', () => {
    expect(validateResponse('', [{ ...required, isActive: false }]).length).toBe(0);
  });
});
