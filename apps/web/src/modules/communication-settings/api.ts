import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { COMM_SETTINGS_ENDPOINTS } from './constants.js';
import type { CommSettings } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const commSettingsApi = {
  get: () => http<CommSettings>(COMM_SETTINGS_ENDPOINTS.get),

  update: (patch: Record<string, unknown>) =>
    http<CommSettings>(COMM_SETTINGS_ENDPOINTS.update, { method: 'PATCH', body: JSON.stringify(patch) }),

  updateBranding: (branding: Record<string, unknown>) =>
    http<CommSettings>(COMM_SETTINGS_ENDPOINTS.branding, { method: 'PATCH', body: JSON.stringify({ branding }) }),

  updateChannels: (channels: Record<string, boolean>) =>
    http<CommSettings>(COMM_SETTINGS_ENDPOINTS.channels, { method: 'PATCH', body: JSON.stringify(channels) }),

  updateNotifications: (settings: Record<string, unknown>) =>
    http<CommSettings>(COMM_SETTINGS_ENDPOINTS.notifications, { method: 'PATCH', body: JSON.stringify(settings) }),

  updatePrivacy: (settings: Record<string, unknown>) =>
    http<CommSettings>(COMM_SETTINGS_ENDPOINTS.privacy, { method: 'PATCH', body: JSON.stringify(settings) }),
};
