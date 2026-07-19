import { describe, expect, it } from 'vitest';

import { evaluateCondition, evaluateNode, validateConditionTree } from '../engine/conditional.logic.js';
import type { ConditionTree } from '../types.js';

describe('conditional logic engine', () => {
  it('evaluates a leaf equals', () => {
    const tree: ConditionTree = { kind: 'leaf', questionId: 'q1', operator: 'equals', value: 'yes' };
    expect(evaluateCondition(tree, { q1: 'yes' })).toBe(true);
    expect(evaluateCondition(tree, { q1: 'no' })).toBe(false);
  });

  it('returns true for a null tree (no constraint)', () => {
    expect(evaluateCondition(null, {})).toBe(true);
  });

  it('evaluates AND groups', () => {
    const tree: ConditionTree = {
      kind: 'group',
      combinator: 'AND',
      children: [
        { kind: 'leaf', questionId: 'q1', operator: 'equals', value: 'yes' },
        { kind: 'leaf', questionId: 'q2', operator: 'gte', value: 5 },
      ],
    };
    expect(evaluateNode(tree, { q1: 'yes', q2: 6 })).toBe(true);
    expect(evaluateNode(tree, { q1: 'yes', q2: 3 })).toBe(false);
  });

  it('evaluates OR groups with nesting', () => {
    const tree: ConditionTree = {
      kind: 'group',
      combinator: 'OR',
      children: [
        { kind: 'leaf', questionId: 'q1', operator: 'answered' },
        {
          kind: 'group',
          combinator: 'AND',
          children: [
            { kind: 'leaf', questionId: 'q2', operator: 'in', value: ['a', 'b'] },
            { kind: 'leaf', questionId: 'q3', operator: 'contains', value: 'x' },
          ],
        },
      ],
    };
    expect(evaluateNode(tree, { q1: '' })).toBe(false);
    expect(evaluateNode(tree, { q1: 'something' })).toBe(true);
    expect(evaluateNode(tree, { q1: '', q2: 'a', q3: 'xylophone' })).toBe(true);
    expect(evaluateNode(tree, { q1: '', q2: 'c', q3: 'x' })).toBe(false);
  });

  it('handles is_empty / is_not_empty', () => {
    const empty: ConditionTree = { kind: 'leaf', questionId: 'q1', operator: 'is_empty' };
    expect(evaluateCondition(empty, { q1: [] })).toBe(true);
    expect(evaluateCondition(empty, { q1: 'x' })).toBe(false);
  });

  it('validates structurally sound and broken trees', () => {
    expect(validateConditionTree(null)).toEqual([]);
    expect(validateConditionTree({ kind: 'leaf', questionId: 'q1', operator: 'equals', value: 1 })).toEqual([]);
    const broken: ConditionTree = { kind: 'group', combinator: 'AND', children: [] };
    expect(validateConditionTree(broken).length).toBeGreaterThan(0);
  });
});
