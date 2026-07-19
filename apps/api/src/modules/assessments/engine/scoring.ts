// Scoring engine — pure functions to compute question / section / overall scores.
//
// Supports: pass_fail, percentage, weighted, risk, compliance, manual, automatic.

import type { AnswerValue } from './conditional.logic.js';
import type { AssessmentQuestion, ScoringMethod, ScoringConfig } from '../types.js';

export interface ScoreResult {
  method: ScoringMethod;
  rawValue: number | null;
  normalizedScore: number; // 0..100
  weightedScore: number;
  maxScore: number;
  label: string | null;
  passed: boolean | null;
  details: Record<string, unknown>;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Pass/Fail: an option score > 0 (or a boolean yes/pass) is a pass.
 */
function scorePassFail(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  const passThreshold = config.passThreshold ?? 1;
  let passed: boolean;
  if (typeof value === 'boolean') passed = value;
  else if (Array.isArray(value) || typeof value === 'string') {
    const selected = Array.isArray(value) ? value : [value];
    passed = selected.some((v) => Number(scoreForOption(question, String(v)) ?? 0) >= passThreshold);
  } else {
    passed = Number(value ?? 0) >= passThreshold;
  }
  return {
    method: 'pass_fail',
    rawValue: typeof value === 'number' ? value : 1,
    normalizedScore: passed ? 100 : 0,
    weightedScore: passed ? Number(config.weight ?? 1) : 0,
    maxScore: 100,
    label: passed ? 'Pass' : 'Fail',
    passed,
    details: { value },
  };
}

/**
 * Percentage: a 0..100 raw value (or derived from option scores).
 */
function scorePercentage(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  let pct: number;
  if (typeof value === 'number') pct = value;
  else if (Array.isArray(value) || typeof value === 'string') {
    const selected = Array.isArray(value) ? value : [value];
    const total = selected.length || 1;
    const sum = selected.reduce((acc, v) => acc + Number(scoreForOption(question, String(v)) ?? 0), 0);
    pct = sum / total;
  } else pct = 0;
  pct = clamp(pct, 0, Number(config.maxScore ?? 100));
  return {
    method: 'percentage',
    rawValue: pct,
    normalizedScore: pct,
    weightedScore: (pct / 100) * Number(config.weight ?? 1),
    maxScore: Number(config.maxScore ?? 100),
    label: `${Math.round(pct)}%`,
    passed: null,
    details: { value },
  };
}

/**
 * Weighted: numeric value scaled by weight / maxScore.
 */
function scoreWeighted(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  const max = Number(config.maxScore ?? 100);
  const raw = resolveNumeric(question, value);
  const normalized = max > 0 ? clamp((raw / max) * 100) : 0;
  const weight = Number(config.weight ?? 1);
  return {
    method: 'weighted',
    rawValue: raw,
    normalizedScore: normalized,
    weightedScore: (normalized / 100) * weight,
    maxScore: max,
    label: `${Math.round(normalized)}%`,
    passed: null,
    details: { value, weight },
  };
}

/**
 * Risk: combination of likelihood x impact -> risk band.
 */
function scoreRisk(question: AssessmentQuestion, value: AnswerValue, _config: ScoringConfig): ScoreResult {
  // value may be { likelihood, impact } (1..5) or a stored risk score.
  let likelihood = 1;
  let impact = 1;
  if (value && typeof value === 'object') {
    const v = value as Record<string, number>;
    likelihood = Number(v.likelihood ?? v.severity ?? 1);
    impact = Number(v.impact ?? v.likelihood ?? 1);
  } else if (typeof value === 'number') {
    likelihood = impact = value;
  }
  const score = clamp(likelihood * impact);
  const band = score >= 16 ? 'Critical' : score >= 9 ? 'High' : score >= 4 ? 'Medium' : 'Low';
  return {
    method: 'risk',
    rawValue: score,
    normalizedScore: (score / 25) * 100,
    weightedScore: (score / 25) * Number(_config.weight ?? 1),
    maxScore: 25,
    label: band,
    passed: band === 'Low',
    details: { likelihood, impact, band },
  };
}

/**
 * Compliance: option-scored, maps to a compliance percentage (e.g. compliant vs not).
 */
function scoreCompliance(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  const weight = Number(config.weight ?? 1);
  let compliant = false;
  if (typeof value === 'boolean') compliant = value;
  else if (Array.isArray(value) || typeof value === 'string') {
    const selected = Array.isArray(value) ? value : [value];
    compliant = selected.some((v) => {
      const s = scoreForOption(question, String(v));
      return s !== null && s > 0;
    });
  } else compliant = Number(value ?? 0) > 0;
  return {
    method: 'compliance',
    rawValue: compliant ? 1 : 0,
    normalizedScore: compliant ? 100 : 0,
    weightedScore: compliant ? weight : 0,
    maxScore: 100,
    label: compliant ? 'Compliant' : 'Non-compliant',
    passed: compliant,
    details: { value },
  };
}

/**
 * Automatic: derive a 0..100 number from a numeric answer (identity), useful for ratings.
 */
function scoreAutomatic(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  const max = Number(config.maxScore ?? 100);
  const raw = resolveNumeric(question, value);
  const normalized = max > 0 ? clamp((raw / max) * 100) : 0;
  return {
    method: 'automatic',
    rawValue: raw,
    normalizedScore: normalized,
    weightedScore: (normalized / 100) * Number(config.weight ?? 1),
    maxScore: max,
    label: String(raw),
    passed: null,
    details: { value },
  };
}

/**
 * Manual: score supplied directly by an assessor (already in answerJson.score).
 */
function scoreManual(question: AssessmentQuestion, value: AnswerValue, config: ScoringConfig): ScoreResult {
  const raw = typeof value === 'number' ? value : Number((value as Record<string, unknown>)?.score ?? 0);
  const max = Number(config.maxScore ?? 100);
  const normalized = max > 0 ? clamp((raw / max) * 100) : 0;
  return {
    method: 'manual',
    rawValue: raw,
    normalizedScore: normalized,
    weightedScore: (normalized / 100) * Number(config.weight ?? 1),
    maxScore: max,
    label: String(raw),
    passed: null,
    details: { value },
  };
}

/**
 * Look up a configured option score by its value/label.
 */
export function scoreForOption(question: AssessmentQuestion, value: string): number | null {
  const opts = question.options ?? [];
  const opt = opts.find((o) => o.value === value || o.label === value);
  return opt ? Number(opt.score ?? 0) : null;
}

/**
 * Resolve a numeric score for a raw answer: numeric answers pass through,
 * while string/array selections resolve to their configured option score.
 */
function resolveNumeric(question: AssessmentQuestion, value: AnswerValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const opt = scoreForOption(question, value);
    if (opt !== null) return opt;
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  if (Array.isArray(value)) {
    const scores = value.map((v) => scoreForOption(question, String(v)) ?? (Number(v) || 0));
    return scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  }
  return 0;
}

/**
 * Compute a single question's score from its answer value + scoring config.
 */
export function computeQuestionScore(
  question: AssessmentQuestion,
  value: AnswerValue,
  config: ScoringConfig,
): ScoreResult {
  const method = config.method ?? question.scoringConfig?.method ?? 'automatic';
  switch (method) {
    case 'pass_fail':
      return scorePassFail(question, value, config);
    case 'percentage':
      return scorePercentage(question, value, config);
    case 'weighted':
      return scoreWeighted(question, value, config);
    case 'risk':
      return scoreRisk(question, value, config);
    case 'compliance':
      return scoreCompliance(question, value, config);
    case 'manual':
      return scoreManual(question, value, config);
    case 'automatic':
    default:
      return scoreAutomatic(question, value, config);
  }
}

export interface SectionAggregate {
  sectionId: string;
  normalizedScore: number; // 0..100 weighted across questions
  weightedScore: number;
  maxWeighted: number;
  questionCount: number;
  passedCount: number;
  failedCount: number;
}

/**
 * Aggregate question scores into a section score (weighted by question weight).
 */
export function aggregateSection(sectionId: string, scores: ScoreResult[]): SectionAggregate {
  const totalWeight = scores.reduce((acc, s) => acc + (Number(s.details?.weight) || 1), 0);
  const weightedSum = scores.reduce((acc, s) => acc + ((s.normalizedScore || 0) / 100) * (Number(s.details?.weight) || 1), 0);
  const normalized = totalWeight > 0 ? clamp((weightedSum / totalWeight) * 100) : 0;
  return {
    sectionId,
    normalizedScore: normalized,
    weightedScore: weightedSum,
    maxWeighted: totalWeight,
    questionCount: scores.length,
    passedCount: scores.filter((s) => s.passed === true).length,
    failedCount: scores.filter((s) => s.passed === false).length,
  };
}

export interface OverallAggregate {
  normalizedScore: number; // 0..100
  weightedScore: number;
  maxWeighted: number;
  sectionCount: number;
  questionCount: number;
  passedCount: number;
  failedCount: number;
  bySection: SectionAggregate[];
}

/**
 * Aggregate section aggregates into an overall score.
 */
export function aggregateOverall(sections: SectionAggregate[]): OverallAggregate {
  const totalWeight = sections.reduce((acc, s) => acc + (s.maxWeighted || 1), 0);
  const weightedSum = sections.reduce((acc, s) => acc + (s.normalizedScore / 100) * (s.maxWeighted || 1), 0);
  const normalized = totalWeight > 0 ? clamp((weightedSum / totalWeight) * 100) : 0;
  return {
    normalizedScore: normalized,
    weightedScore: weightedSum,
    maxWeighted: totalWeight,
    sectionCount: sections.length,
    questionCount: sections.reduce((acc, s) => acc + s.questionCount, 0),
    passedCount: sections.reduce((acc, s) => acc + s.passedCount, 0),
    failedCount: sections.reduce((acc, s) => acc + s.failedCount, 0),
    bySection: sections,
  };
}
