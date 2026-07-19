import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { NOTIFICATION_ENDPOINTS } from './constants.js';
import type {
  Notification,
  NotificationPreference,
  NotificationDelivery,
  NotificationCreateInput,
  NotificationUpdateInput,
  PreferenceUpdateInput,
  NotificationStats,
  NotificationListParams,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const notificationsApi = {
  list: (params?: NotificationListParams) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ notifications: Notification[]; total: number }>(`${NOTIFICATION_ENDPOINTS.list}${q ? `?${q}` : ''}`);
  },

  unreadCount: () => http<{ count: number }>(NOTIFICATION_ENDPOINTS.unreadCount),

  stats: () => http<NotificationStats>(NOTIFICATION_ENDPOINTS.stats),

  create: (dto: NotificationCreateInput) =>
    http<Notification>(NOTIFICATION_ENDPOINTS.create, { method: 'POST', body: JSON.stringify(dto) }),

  get: (id: string) => http<Notification>(NOTIFICATION_ENDPOINTS.get(id)),

  update: (id: string, patch: NotificationUpdateInput) =>
    http<Notification>(NOTIFICATION_ENDPOINTS.update(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  remove: (id: string) => http<void>(NOTIFICATION_ENDPOINTS.delete(id), { method: 'DELETE' }),

  markRead: (id: string) => http<Notification>(NOTIFICATION_ENDPOINTS.markRead(id), { method: 'POST' }),

  markUnread: (id: string) => http<Notification>(NOTIFICATION_ENDPOINTS.markUnread(id), { method: 'POST' }),

  archive: (id: string) => http<Notification>(NOTIFICATION_ENDPOINTS.archive(id), { method: 'POST' }),

  markAllRead: () => http<void>(NOTIFICATION_ENDPOINTS.markAllRead, { method: 'POST' }),

  listPreferences: () => http<NotificationPreference[]>(NOTIFICATION_ENDPOINTS.preferences),

  updatePreference: (id: string, patch: PreferenceUpdateInput) =>
    http<NotificationPreference>(NOTIFICATION_ENDPOINTS.preferenceUpdate(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  getDeliveries: (id: string) =>
    http<NotificationDelivery[]>(`${NOTIFICATION_ENDPOINTS.get(id)}/deliveries`),
};
