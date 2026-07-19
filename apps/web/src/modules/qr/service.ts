import { qrApi } from './api.js';
import type { QrCode } from './types.js';

export const qrService = {
  list: (params?: { type?: string; isActive?: boolean }) => qrApi.list(params),
  stats: () => qrApi.stats(),
  create: (dto: Partial<QrCode>) => qrApi.create(dto),
  get: (id: string) => qrApi.get(id),
  update: (id: string, patch: Partial<QrCode>) => qrApi.update(id, patch),
  remove: (id: string) => qrApi.remove(id),
  regenerate: (id: string) => qrApi.regenerate(id),
  analytics: (id?: string) => qrApi.analytics(id),
};
