import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { escalationRuleRepo, escalationHistoryRepo } from '../repositories/escalation-rule.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export async function checkAndEscalate(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const org = await organizationRepo.findById(case_.organizationId);
  if (!org) throw new NotFoundError('Organization not found');
  const rules = await escalationRuleRepo.listActive(case_.organizationId);
  for (const rule of rules) {
    let shouldEscalate = false;
    switch (rule.conditionType) {
      case 'priority':
        shouldEscalate = case_.priority === rule.conditionValue;
        break;
      case 'severity':
        shouldEscalate = case_.severity === rule.conditionValue;
        break;
      case 'category':
        shouldEscalate = case_.category === rule.conditionValue;
        break;
      case 'time_sla':
        if (case_.slaDeadline && new Date(case_.slaDeadline) < new Date()) shouldEscalate = true;
        break;
      default:
        break;
    }
    if (shouldEscalate) {
      await escalateCase(caseId, rule.id, rule.escalateToUserId, `Rule ${rule.name} matched`, null);
    }
  }
}

export async function escalateCase(caseId, ruleId, escalatedTo, reason, triggeredBy) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const previousAssignee = case_.assignedTo?.[0] ?? null;
  await escalationHistoryRepo.create({
    caseId,
    ruleId,
    triggeredBy: triggeredBy ?? null,
    escalatedTo,
    previousAssignee,
    reason,
  });
  if (escalatedTo && !case_.assignedTo?.includes(escalatedTo)) {
    await caseRepo.update(caseId, { assignedTo: [...(case_.assignedTo ?? []), escalatedTo] });
  }
  await audit({ organizationId: case_.organizationId, actorId: triggeredBy ?? null, action: 'case.escalate', entity: 'case', entityId: caseId, metadata: { ruleId, escalatedTo, reason } });
  return case_;
}

export async function getEscalationHistory(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  return escalationHistoryRepo.listByCase(caseId);
}
