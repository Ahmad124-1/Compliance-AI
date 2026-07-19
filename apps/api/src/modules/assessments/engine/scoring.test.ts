import { describe, expect, it } from 'vitest';

import { computeQuestionScore, aggregateSection, aggregateOverall, scoreForOption } from '../engine/scoring.js';
import type { AssessmentQuestion } from '../types.js';

function q(over: Partial<AssessmentQuestion> = {}): AssessmentQuestion {
  return {
    id: 'q1', templateId: 't1', sectionId: 's1', parentQuestionId: null, groupId: null, code: null,
    label: 'Q', helpText: null, answerTypeId: null, answerTypeKey: 'yes_no', position: 0, weight: 1,
    isRequired: false, allowsMultiple: false, maxSelections: null, scoringConfig: {}, validationRules: {},
    conditionalLogic: null, visibilityRules: null, dependencyRules: null, frameworkMappings: [], controlMappings: [],
    metadata: {}, options: [], createdAt: new Date(), updatedAt: new Date(), ...over,
  };
}

describe('scoring engine', () => {
  it('computes pass/fail from boolean', () => {
    const r = computeQuestionScore(q(), true, { method: 'pass_fail', weight: 2 });
    expect(r.passed).toBe(true);
    expect(r.normalizedScore).toBe(100);
    expect(r.weightedScore).toBe(2);
  });

  it('computes percentage from a numeric value', () => {
    const r = computeQuestionScore(q(), 75, { method: 'percentage', maxScore: 100 });
    expect(r.normalizedScore).toBe(75);
    expect(r.label).toBe('75%');
  });

  it('computes weighted from option score', () => {
    const question = q({ answerTypeKey: 'radio', options: [{ id: 'o1', questionId: 'q1', label: 'Good', value: 'good', position: 0, score: 80, description: null, isDefault: false, conditionalLogic: null, metadata: {} }] });
    const r = computeQuestionScore(question, 'good', { method: 'weighted', maxScore: 100, weight: 1 });
    expect(r.normalizedScore).toBe(80);
  });

  it('computes risk band from likelihood x impact', () => {
    const r = computeQuestionScore(q(), { likelihood: 3, impact: 3 }, { method: 'risk', weight: 1 });
    expect(r.normalizedScore).toBe(36);
    expect(r.label).toBe('High');
  });

  it('computes compliance from option selection', () => {
    const question = q({ answerTypeKey: 'radio', options: [{ id: 'o1', questionId: 'q1', label: 'Yes', value: 'yes', position: 0, score: 1, description: null, isDefault: false, conditionalLogic: null, metadata: {} }] });
    const r = computeQuestionScore(question, 'yes', { method: 'compliance', weight: 1 });
    expect(r.passed).toBe(true);
    expect(r.label).toBe('Compliant');
  });

  it('falls back to automatic method', () => {
    const r = computeQuestionScore(q({ answerTypeKey: 'rating' }), 4, { method: 'automatic', maxScore: 5 });
    expect(r.normalizedScore).toBe(80);
  });

  it('looks up option scores', () => {
    const question = q({ options: [{ id: 'o1', questionId: 'q1', label: 'A', value: 'a', position: 0, score: 10, description: null, isDefault: false, conditionalLogic: null, metadata: {} }] });
    expect(scoreForOption(question, 'a')).toBe(10);
  });

  it('aggregates sections and overall', () => {
    const s1 = aggregateSection('s1', [
      { method: 'automatic', rawValue: 80, normalizedScore: 80, weightedScore: 80, maxScore: 100, label: '80', passed: null, details: {} },
      { method: 'automatic', rawValue: 60, normalizedScore: 60, weightedScore: 60, maxScore: 100, label: '60', passed: null, details: {} },
    ]);
    expect(s1.normalizedScore).toBe(70);
    expect(s1.questionCount).toBe(2);
    const overall = aggregateOverall([s1]);
    expect(overall.normalizedScore).toBe(70);
    expect(overall.sectionCount).toBe(1);
  });
});
