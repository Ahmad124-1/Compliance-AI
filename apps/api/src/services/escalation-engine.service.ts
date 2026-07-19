import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { escalationLevelRepo } from '../repositories/escalation-level.repo.js';
import { escalationRuleV2Repo } from '../repositories/escalation-rule-v2.repo.js';
import { escalationHistoryRepo } from '../repositories/escalation-history.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { query } from '../db/pool.js';
import { notificationService } from './notification.service.js';

export interface EscalationLevelInput {
  organizationId: string;
  name: string;
  level: number;
  description?: string | null;
  roleId?: string | null;
  notifyRoles?: string[];
  autoEscalateAfterMinutes?: number | null;
  isActive?: boolean;
}

export interface EscalationRuleInput {
  organizationId: string;
  name: string;
  description?: string | null;
  conditionType: string;
  conditionValue: string;
  conditionOperator?: string;
  escalateToLevelId?: string | null;
  escalateToRoleId?: string | null;
  escalateToUserId?: string | null;
  notificationChannels?: string[];
  autoEscalate?: boolean;
  autoEscalateAfterMinutes?: number | null;
  requireApproval?: boolean;
  isActive?: boolean;
}

export const escalationEngineService = {
  async createLevel(input: EscalationLevelInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const level = await escalationLevelRepo.create(input);
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'escalation.level.create', entity: 'escalation_level', entityId: level.id });
    return level;
  },

  async getLevel(orgId, id) {
    const level = await escalationLevelRepo.findById(id);
    if (!level || level.organizationId !== orgId) throw new NotFoundError('Escalation level not found');
    return level;
  },

  async listLevels(orgId) {
    return escalationLevelRepo.findByOrganization(orgId);
  },

  async updateLevel(orgId, id, patch, actorId?) {
    const level = await escalationLevelRepo.findById(id);
    if (!level || level.organizationId !== orgId) throw new NotFoundError('Escalation level not found');
    const updated = await escalationLevelRepo.update(id, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'escalation.level.update', entity: 'escalation_level', entityId: id });
    return updated;
  },

  async deleteLevel(orgId, id) {
    const level = await escalationLevelRepo.findById(id);
    if (!level || level.organizationId !== orgId) throw new NotFoundError('Escalation level not found');
    await escalationLevelRepo.delete(id);
    await audit({ organizationId: orgId, action: 'escalation.level.delete', entity: 'escalation_level', entityId: id });
  },

  async createRule(input: EscalationRuleInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const rule = await escalationRuleV2Repo.create(input);
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'escalation.rule.create', entity: 'escalation_rule', entityId: rule.id });
    return rule;
  },

  async getRule(orgId, id) {
    const rule = await escalationRuleV2Repo.findById(id);
    if (!rule || rule.organizationId !== orgId) throw new NotFoundError('Escalation rule not found');
    return rule;
  },

  async listRules(orgId) {
    return escalationRuleV2Repo.findByOrganization(orgId);
  },

  async updateRule(orgId, id, patch, actorId?) {
    const rule = await escalationRuleV2Repo.findById(id);
    if (!rule || rule.organizationId !== orgId) throw new NotFoundError('Escalation rule not found');
    const updated = await escalationRuleV2Repo.update(id, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'escalation.rule.update', entity: 'escalation_rule', entityId: id });
    return updated;
  },

  async deleteRule(orgId, id) {
    const rule = await escalationRuleV2Repo.findById(id);
    if (!rule || rule.organizationId !== orgId) throw new NotFoundError('Escalation rule not found');
    await escalationRuleV2Repo.delete(id);
    await audit({ organizationId: orgId, action: 'escalation.rule.delete', entity: 'escalation_rule', entityId: id });
  },

  async evaluateRules(caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_) throw new NotFoundError('Case not found');
    const rules = await escalationRuleV2Repo.listActive(case_.organizationId);
    const results: any[] = [];
    for (const rule of rules) {
      if (await this.evaluateCondition(case_, rule)) {
        const result = await this.autoEscalate(caseId, rule);
        results.push(result);
      }
    }
    return results;
  },

  async evaluateCondition(case_, rule) {
    switch (rule.conditionType) {
      case 'priority':
        return rule.conditionOperator === 'equals' ? case_.priority === rule.conditionValue : case_.priority !== rule.conditionValue;
      case 'severity':
        return rule.conditionOperator === 'equals' ? case_.severity === rule.conditionValue : case_.severity !== rule.conditionValue;
      case 'category':
        return rule.conditionOperator === 'equals' ? case_.category === rule.conditionValue : case_.category !== rule.conditionValue;
      case 'time_sla':
        if (case_.slaDeadline && new Date(case_.slaDeadline) < new Date()) return true;
        return false;
      case 'factory':
        return rule.conditionOperator === 'equals' ? case_.factoryId === rule.conditionValue : case_.factoryId !== rule.conditionValue;
      case 'department':
        return rule.conditionOperator === 'equals' ? case_.departmentId === rule.conditionValue : case_.departmentId !== rule.conditionValue;
      case 'country':
        return rule.conditionOperator === 'equals' ? case_.country === rule.conditionValue : case_.country !== rule.conditionValue;
      case 'organization':
        return rule.conditionOperator === 'equals' ? case_.organizationId === rule.conditionValue : case_.organizationId !== rule.conditionValue;
      default:
        return false;
    }
  },

  async autoEscalate(caseId, rule) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_) throw new NotFoundError('Case not found');
    const history = await escalationHistoryRepo.create({
      caseId,
      ruleId: rule.id,
      triggeredBy: null,
      escalatedTo: rule.escalateToUserId,
      previousAssignee: case_.assignedTo?.[0] ?? null,
      reason: `Auto-escalated by rule ${rule.name}`,
      metadata: { ruleName: rule.name, channels: rule.notificationChannels },
    });
    if (rule.escalateToUserId && !case_.assignedTo?.includes(rule.escalateToUserId)) {
      await caseRepo.update(caseId, { assignedTo: [...(case_.assignedTo ?? []), rule.escalateToUserId] });
    }
    if (rule.notificationChannels?.includes('in_app')) {
      await notificationService.createNotification({
        organizationId: case_.organizationId,
        userId: rule.escalateToUserId,
        type: 'escalation',
        channel: 'in_app',
        title: `Case ${case_.caseNumber} auto-escalated`,
        body: `Case ${case_.caseNumber} was auto-escalated by rule ${rule.name}`,
        data: { caseId, ruleId: rule.id },
      });
    }
    await audit({ organizationId: case_.organizationId, action: 'escalation.auto', entity: 'case', entityId: caseId, metadata: { ruleId: rule.id } });
    return history;
  },

  async manualEscalate(caseId, ruleId, escalatedTo, reason, actorId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_) throw new NotFoundError('Case not found');
    const history = await escalationHistoryRepo.create({
      caseId,
      ruleId: ruleId ?? null,
      triggeredBy: actorId,
      escalatedTo,
      previousAssignee: case_.assignedTo?.[0] ?? null,
      reason,
      metadata: { manual: true },
    });
    if (escalatedTo && !case_.assignedTo?.includes(escalatedTo)) {
      await caseRepo.update(caseId, { assignedTo: [...(case_.assignedTo ?? []), escalatedTo] });
    }
    await audit({ organizationId: case_.organizationId, actorId, action: 'escalation.manual', entity: 'case', entityId: caseId, metadata: { ruleId, escalatedTo, reason } });
    return history;
  },

  async getEscalationHistory(caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_) throw new NotFoundError('Case not found');
    return escalationHistoryRepo.listByCase(caseId);
  },

  async getPendingEscalations(orgId) {
    const cases = await query(
      `SELECT c.* FROM cases c
       JOIN escalation_rules_v2 r ON r.organization_id = c.organization_id
       WHERE c.organization_id = $1 AND c.is_deleted = FALSE AND c.sla_deadline < now()
       ORDER BY c.sla_deadline ASC`,
      [orgId],
    );
    return cases.rows.map((row) => ({
      id: row.id,
      caseNumber: row.case_number,
      title: row.title,
      slaDeadline: row.sla_deadline,
      priority: row.priority,
      assignedTo: row.assigned_to,
    }));
  },
};
