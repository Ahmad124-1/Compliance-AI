import { escalationApi } from './api.js';
import type {
  EscalationRuleCreateInput,
  EscalationRuleUpdateInput,
  EscalationLevelCreateInput,
} from './types.js';

export const escalationService = {
  listRules: (params?: { entityType?: string; search?: string; limit?: number; offset?: number }) =>
    escalationApi.listRules(params),
  createRule: (dto: EscalationRuleCreateInput) => escalationApi.createRule(dto),
  getRule: (id: string) => escalationApi.getRule(id),
  updateRule: (id: string, patch: EscalationRuleUpdateInput) => escalationApi.updateRule(id, patch),
  deleteRule: (id: string) => escalationApi.deleteRule(id),
  evaluateRule: (id: string, entityId: string) => escalationApi.evaluateRule(id, entityId),
  listLevels: () => escalationApi.listLevels(),
  createLevel: (dto: EscalationLevelCreateInput) => escalationApi.createLevel(dto),
  getLevel: (id: string) => escalationApi.getLevel(id),
  updateLevel: (id: string, patch: Partial<EscalationLevelCreateInput>) => escalationApi.updateLevel(id, patch),
  deleteLevel: (id: string) => escalationApi.deleteLevel(id),
};
