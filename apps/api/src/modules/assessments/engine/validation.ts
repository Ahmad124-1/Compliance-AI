// Validation engine — validate responses against validation rules.
//
// Rule types: required, range, pattern, file, answer, custom, conditional.
// Conditional rules only apply when their `appliesWhen` condition tree matches.

import { evaluateCondition } from './conditional.logic.js';
import type { AnswerValue } from './conditional.logic.js';
import type {
  ValidationRuleType,
  ConditionTree,
} from '../types.js';

/**
 * Minimal shape required by the validation engine — decouples the engine from
 * the full persisted AssessmentValidationRule entity.
 */
export interface ValidationRuleLike {
  id?: string;
  questionId?: string | null;
  ruleType: ValidationRuleType;
  params?: Record<string, unknown>;
  message?: string | null;
  severity?: 'error' | 'warning';
  isActive?: boolean;
  appliesWhen?: unknown;
}

export interface ValidationIssue {
  ruleId: string;
  ruleType: ValidationRuleType;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

function isBlank(v: AnswerValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

function answerAsNumber(v: AnswerValue): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (obj.value !== undefined) return answerAsNumber(obj.value as AnswerValue);
  }
  return null;
}

function validateRequired(rule: ValidationRuleLike, value: AnswerValue): string | null {
  const params = rule.params as { message?: string };
  if (isBlank(value)) return rule.message ?? params?.message ?? 'This field is required.';
  return null;
}

function validateRange(rule: ValidationRuleLike, value: AnswerValue): string | null {
  const params = rule.params as { min?: number; max?: number };
  const n = answerAsNumber(value);
  if (n === null) return rule.message ?? 'Value must be numeric.';
  if (params.min !== undefined && n < params.min) return rule.message ?? `Value must be at least ${params.min}.`;
  if (params.max !== undefined && n > params.max) return rule.message ?? `Value must be at most ${params.max}.`;
  return null;
}

function validatePattern(rule: ValidationRuleLike, value: AnswerValue): string | null {
  const params = rule.params as { pattern?: string; flags?: string };
  if (isBlank(value)) return null;
  const re = new RegExp(params.pattern ?? '', params.flags ?? '');
  if (!re.test(String(value))) return rule.message ?? 'Value does not match the required format.';
  return null;
}

function validateFile(rule: ValidationRuleLike, value: AnswerValue): string | null {
  const params = rule.params as { maxSizeMb?: number; allowedTypes?: string[] };
  if (isBlank(value)) return null;
  const meta = (typeof value === 'object' && value ? (value as Record<string, unknown>) : {}) as {
    size?: number;
    type?: string;
  };
  if (params.maxSizeMb && typeof meta.size === 'number' && meta.size > params.maxSizeMb * 1024 * 1024) {
    return rule.message ?? `File exceeds ${params.maxSizeMb}MB limit.`;
  }
  if (params.allowedTypes && params.allowedTypes.length && meta.type && !params.allowedTypes.includes(meta.type)) {
    return rule.message ?? `File type ${meta.type} is not allowed.`;
  }
  return null;
}

function validateAnswer(rule: ValidationRuleLike, value: AnswerValue): string | null {
  const params = rule.params as { allowed?: unknown[]; notAllowed?: unknown[] };
  const asStr = Array.isArray(value) ? value.map(String) : [String(value)];
  if (params.allowed && params.allowed.length) {
    const allowed = params.allowed.map(String);
    if (!asStr.every((v) => allowed.includes(v))) return rule.message ?? 'Contains an invalid selection.';
  }
  if (params.notAllowed && params.notAllowed.length) {
    const banned = params.notAllowed.map(String);
    if (asStr.some((v) => banned.includes(v))) return rule.message ?? 'Contains a disallowed selection.';
  }
  return null;
}

/**
 * Validate a single response value against a set of rules.
 */
export function validateResponse(
  value: AnswerValue,
  rules: ValidationRuleLike[],
  answers: Record<string, AnswerValue> = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const rule of rules) {
    if (rule.isActive === false) continue;
    if (rule.appliesWhen && !evaluateCondition(rule.appliesWhen as ConditionTree, answers)) continue;

    let msg: string | null = null;
    switch (rule.ruleType) {
      case 'required':
        msg = validateRequired(rule, value);
        break;
      case 'range':
        msg = validateRange(rule, value);
        break;
      case 'pattern':
        msg = validatePattern(rule, value);
        break;
      case 'file':
        msg = validateFile(rule, value);
        break;
      case 'answer':
        msg = validateAnswer(rule, value);
        break;
      case 'conditional':
        // Conditional rules resolve to a required-style check when the condition holds.
        msg = validateRequired(rule, value);
        break;
      case 'custom':
        // Custom rules are enforced client-side / via stored procedure; pass-through here.
        break;
    }
    if (msg) {
      issues.push({
        ruleId: rule.id ?? 'rule',
        ruleType: rule.ruleType,
        field: rule.questionId ?? 'response',
        message: msg,
        severity: rule.severity ?? 'error',
      });
    }
  }
  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}
