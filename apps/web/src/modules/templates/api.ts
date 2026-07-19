import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { TEMPLATE_ENDPOINTS } from './constants.js';
import type {
  MessageTemplate,
  MessageTemplateCreateInput,
  MessageTemplateUpdateInput,
  TemplateRenderInput,
  TemplateRenderOutput,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const templatesApi = {
  list: (params?: { channel?: string; category?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ templates: MessageTemplate[]; total: number }>(`${TEMPLATE_ENDPOINTS.list}${q ? `?${q}` : ''}`);
  },

  stats: () => http<{ total: number; byChannel: Record<string, number> }>(TEMPLATE_ENDPOINTS.stats),

  create: (dto: MessageTemplateCreateInput) =>
    http<MessageTemplate>(TEMPLATE_ENDPOINTS.create, { method: 'POST', body: JSON.stringify(dto) }),

  get: (id: string) => http<MessageTemplate>(TEMPLATE_ENDPOINTS.get(id)),

  update: (id: string, patch: MessageTemplateUpdateInput) =>
    http<MessageTemplate>(TEMPLATE_ENDPOINTS.update(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  remove: (id: string) => http<void>(TEMPLATE_ENDPOINTS.delete(id), { method: 'DELETE' }),

  render: (id: string, dto: TemplateRenderInput) =>
    http<TemplateRenderOutput>(TEMPLATE_ENDPOINTS.render(id), { method: 'POST', body: JSON.stringify(dto) }),

  duplicate: (id: string) =>
    http<MessageTemplate>(TEMPLATE_ENDPOINTS.duplicate(id), { method: 'POST' }),
};
