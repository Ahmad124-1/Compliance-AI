import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { QR_ENDPOINTS } from './constants.js';
import type { QrCode, QrStats, QrScanEvent } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const qrApi = {
  list: (params?: { type?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    const q = qs.toString();
    return http<QrCode[]>(`${QR_ENDPOINTS.list}${q ? `?${q}` : ''}`);
  },

  stats: () => http<QrStats>(QR_ENDPOINTS.stats),

  create: (dto: Partial<QrCode>) =>
    http<QrCode>(QR_ENDPOINTS.create, { method: 'POST', body: JSON.stringify(dto) }),

  get: (id: string) => http<QrCode>(QR_ENDPOINTS.get(id)),

  update: (id: string, patch: Partial<QrCode>) =>
    http<QrCode>(QR_ENDPOINTS.update(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  remove: (id: string) => http<void>(QR_ENDPOINTS.delete(id), { method: 'DELETE' }),

  regenerate: (id: string) => http<QrCode>(QR_ENDPOINTS.regenerate(id), { method: 'POST' }),

  downloadUrl: (id: string, format: 'png' | 'svg' = 'png') => `${QR_ENDPOINTS.download(id)}?format=${format}`,

  analytics: (id?: string) =>
    http<QrScanEvent[]>(id ? QR_ENDPOINTS.analytics(id) : QR_ENDPOINTS.orgAnalytics),

  scan: (id: string, event: Record<string, string>) =>
    http<QrScanEvent>(QR_ENDPOINTS.scan(id), { method: 'POST', body: JSON.stringify(event) }),
};
