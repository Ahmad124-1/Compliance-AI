import { notificationsApi } from './api.js';
import type {
  NotificationCreateInput,
  NotificationUpdateInput,
  PreferenceUpdateInput,
  NotificationListParams,
} from './types.js';

export const notificationsService = {
  list: (params?: NotificationListParams) => notificationsApi.list(params),
  unreadCount: () => notificationsApi.unreadCount(),
  stats: () => notificationsApi.stats(),
  create: (dto: NotificationCreateInput) => notificationsApi.create(dto),
  get: (id: string) => notificationsApi.get(id),
  update: (id: string, patch: NotificationUpdateInput) => notificationsApi.update(id, patch),
  remove: (id: string) => notificationsApi.remove(id),
  markRead: (id: string) => notificationsApi.markRead(id),
  markUnread: (id: string) => notificationsApi.markUnread(id),
  archive: (id: string) => notificationsApi.archive(id),
  markAllRead: () => notificationsApi.markAllRead(),
  listPreferences: () => notificationsApi.listPreferences(),
  updatePreference: (id: string, patch: PreferenceUpdateInput) => notificationsApi.updatePreference(id, patch),
  getDeliveries: (id: string) => notificationsApi.getDeliveries(id),
};
