// Conditional logic engine — pure evaluators for condition trees.
//
// A condition tree is either a leaf (single comparison against a question answer)
// or a group (AND/OR of child nodes). This module is framework-agnostic: it
// receives a map of questionId -> answer value and evaluates the tree.

import type {
  ConditionGroup,
  ConditionLeaf,
  ConditionNode,
  ConditionTree,
  ConditionOperator,
} from '../types.js';

export type AnswerValue = unknown;

export type AnswerMap = Record<string, AnswerValue>;

function isEmpty(v: AnswerValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

function toComparable(v: AnswerValue): number | string {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.getTime();
  if (Array.isArray(v)) return v.length;
  return String(v ?? '');
}

function evaluateLeaf(leaf: ConditionLeaf, answers: AnswerMap): boolean {
  const actual = answers[leaf.questionId];
  const op: ConditionOperator = leaf.operator;

  switch (op) {
    case 'is_empty':
      return isEmpty(actual);
    case 'is_not_empty':
      return !isEmpty(actual);
    case 'answered':
      return !isEmpty(actual);
    case 'not_answered':
      return isEmpty(actual);
    case 'equals':
      return toComparable(actual) === toComparable(leaf.value);
    case 'not_equals':
      return toComparable(actual) !== toComparable(leaf.value);
    case 'contains': {
      if (Array.isArray(actual)) return actual.map(String).includes(String(leaf.value));
      return String(actual ?? '').includes(String(leaf.value ?? ''));
    }
    case 'in': {
      const list = Array.isArray(leaf.value) ? (leaf.value as unknown[]) : [leaf.value];
      return list.map(toComparable).includes(toComparable(actual));
    }
    case 'not_in': {
      const list = Array.isArray(leaf.value) ? (leaf.value as unknown[]) : [leaf.value];
      return !list.map(toComparable).includes(toComparable(actual));
    }
    case 'gt':
      return Number(toComparable(actual)) > Number(leaf.value);
    case 'gte':
      return Number(toComparable(actual)) >= Number(leaf.value);
    case 'lt':
      return Number(toComparable(actual)) < Number(leaf.value);
    case 'lte':
      return Number(toComparable(actual)) <= Number(leaf.value);
    default:
      return false;
  }
}

function evaluateGroup(group: ConditionGroup, answers: AnswerMap): boolean {
  if (!group.children || group.children.length === 0) return true;
  const results = group.children.map((c) => evaluateNode(c, answers));
  return group.combinator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

export function evaluateNode(node: ConditionNode, answers: AnswerMap): boolean {
  return node.kind === 'group' ? evaluateGroup(node, answers) : evaluateLeaf(node, answers);
}

/**
 * Evaluate a condition tree against a map of question answers.
 * A null tree always evaluates to true (no constraint).
 */
export function evaluateCondition(tree: ConditionTree, answers: AnswerMap): boolean {
  if (!tree) return true;
  return evaluateNode(tree, answers);
}

/**
 * Determine whether a question/section is visible given its visibility rules
 * and the current answers. Nested conditions (IF/ELSE/AND/OR) are supported.
 */
export function isVisible(visibility: ConditionTree, answers: AnswerMap): boolean {
  return evaluateCondition(visibility, answers);
}

/**
 * Validate that a condition tree is structurally sound (used by validation engine).
 */
export function validateConditionTree(tree: ConditionTree): string[] {
  const errors: string[] = [];
  const walk = (node: ConditionNode, path: string): void => {
    if (node.kind === 'leaf') {
      if (!node.questionId) errors.push(`${path}: leaf missing questionId`);
      if (!node.operator) errors.push(`${path}: leaf missing operator`);
      return;
    }
    if (!node.combinator) errors.push(`${path}: group missing combinator`);
    if (!Array.isArray(node.children) || node.children.length === 0) {
      errors.push(`${path}: group requires at least one child`);
      return;
    }
    node.children.forEach((c, i) => walk(c, `${path}.${i}`));
  };
  if (tree) walk(tree, 'root');
  return errors;
}
