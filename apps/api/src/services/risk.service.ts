import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { riskScoreRepo } from '../repositories/risk-score.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { escalationHistoryRepo } from '../repositories/escalation-history.repo.js';

const FACTOR_WEIGHTS = {
  priority: { critical: 30, high: 20, medium: 10, low: 0 },
  severity: { critical: 30, high: 20, medium: 10, low: 0 },
  category: { forced_labor: 20, child_labor: 20, harassment: 15, wage_theft: 15, safety: 15, discrimination: 10, other: 5 },
  source: { anonymous: 5, complainant: 0 },
  hasSlaBreach: 30,
  isEscalated: 20,
  reporterAnonymous: 5,
};

export async function calculateRiskScore(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const factors: Record<string, number> = {};
  let score = 0;
  const priorityWeight = FACTOR_WEIGHTS.priority[case_.priority] ?? 0;
  score += priorityWeight;
  factors.priority = priorityWeight;
  const severityWeight = FACTOR_WEIGHTS.severity[case_.severity] ?? 0;
  score += severityWeight;
  factors.severity = severityWeight;
  const categoryWeight = FACTOR_WEIGHTS.category[case_.category] ?? FACTOR_WEIGHTS.category.other;
  score += categoryWeight;
  factors.category = categoryWeight;
  const sourceWeight = FACTOR_WEIGHTS.source[case_.source] ?? 0;
  score += sourceWeight;
  factors.source = sourceWeight;
  if (case_.reporterAnonymous) {
    score += FACTOR_WEIGHTS.reporterAnonymous;
    factors.reporterAnonymous = FACTOR_WEIGHTS.reporterAnonymous;
  }
  if (case_.slaDeadline && new Date(case_.slaDeadline) < new Date()) {
    score += FACTOR_WEIGHTS.hasSlaBreach;
    factors.hasSlaBreach = FACTOR_WEIGHTS.hasSlaBreach;
  }
  const history = await escalationHistoryRepo.listByCase(caseId);
  if (history.length > 0) {
    score += FACTOR_WEIGHTS.isEscalated;
    factors.isEscalated = FACTOR_WEIGHTS.isEscalated;
  }
  score = Math.min(100, Math.max(0, score));
  const existing = await riskScoreRepo.findByCaseId(caseId);
  if (existing) {
    await riskScoreRepo.update(existing.id, { overallScore: score, factors, calculationMethod: 'automated' });
    await audit({ organizationId: case_.organizationId, action: 'risk.score.recalculate', entity: 'case', entityId: caseId, metadata: { score } });
    return riskScoreRepo.findByCaseId(caseId);
  }
  const created = await riskScoreRepo.create({ caseId: case_.id, overallScore: score, factors, calculationMethod: 'automated' });
  await audit({ organizationId: case_.organizationId, action: 'risk.score.calculate', entity: 'case', entityId: caseId, metadata: { score } });
  return created;
}

export async function getRiskScore(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const riskScore = await riskScoreRepo.findByCaseId(caseId);
  if (!riskScore) {
    return calculateRiskScore(caseId);
  }
  return riskScore;
}
