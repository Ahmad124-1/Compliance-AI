import { templatesApi } from './api.js';
import type {
  MessageTemplateCreateInput,
  MessageTemplateUpdateInput,
  TemplateRenderInput,
} from './types.js';

export const templatesService = {
  list: (params?: { channel?: string; category?: string; search?: string; limit?: number; offset?: number }) =>
    templatesApi.list(params),
  stats: () => templatesApi.stats(),
  create: (dto: MessageTemplateCreateInput) => templatesApi.create(dto),
  get: (id: string) => templatesApi.get(id),
  update: (id: string, patch: MessageTemplateUpdateInput) => templatesApi.update(id, patch),
  remove: (id: string) => templatesApi.remove(id),
  render: (id: string, dto: TemplateRenderInput) => templatesApi.render(id, dto),
  duplicate: (id: string) => templatesApi.duplicate(id),
};
