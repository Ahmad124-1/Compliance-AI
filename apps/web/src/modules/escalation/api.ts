import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ESCALATION_ENDPOINTS } from './constants.js';
import type {
  EscalationRuleV2,
  EscalationLevel,
  EscalationRuleCreateInput,
  EscalationRuleUpdateInput,
  EscalationLevelCreateInput,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const escalationApi = {
  listRules: (params?: { entityType?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ rules: EscalationRuleV2[]; total: number }>(`${ESCALATION_ENDPOINTS.rules}${q ? `?${q}` : ''}`);
  },

  createRule: (dto: EscalationRuleCreateInput) =>
    http<EscalationRuleV2>(ESCALATION_ENDPOINTS.rules, { method: 'POST', body: JSON.stringify(dto) }),

  getRule: (id: string) => http<EscalationRuleV2>(ESCALATION_ENDPOINTS.rule(id)),

  updateRule: (id: string, patch: EscalationRuleUpdateInput) =>
    http<EscalationRuleV2>(ESCALATION_ENDPOINTS.rule(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteRule: (id: string) => http<void>(ESCALATION_ENDPOINTS.ruleDelete(id), { method: 'DELETE' }),

  evaluateRule: (id: string, entityId: string) =>
    http<{ matches: boolean; triggeredLevels: { levelId: string; delayMinutes: number }[] }>(
      `${ESCALATION_ENDPOINTS.evaluate(id)}?entityId=${encodeURIComponent(entityId)}`
    ),

  listLevels: () => http<EscalationLevel[]>(ESCALATION_ENDPOINTS.levels),

  createLevel: (dto: EscalationLevelCreateInput) =>
    http<EscalationLevel>(ESCALATION_ENDPOINTS.levels, { method: 'POST', body: JSON.stringify(dto) }),

  getLevel: (id: string) => http<EscalationLevel>(ESCALATION_ENDPOINTS.level(id)),

  updateLevel: (id: string, patch: Partial<EscalationLevelCreateInput>) =>
    http<EscalationLevel>(ESCALATION_ENDPOINTS.level(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteLevel: (id: string) => http<void>(ESCALATION_ENDPOINTS.levelDelete(id), { method: 'DELETE' }),
};
