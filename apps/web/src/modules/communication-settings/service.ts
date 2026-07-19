import { commSettingsApi } from './api.js';

export const commSettingsService = {
  get: () => commSettingsApi.get(),
  update: (patch: Record<string, unknown>) => commSettingsApi.update(patch),
  updateBranding: (branding: Record<string, unknown>) => commSettingsApi.updateBranding(branding),
  updateChannels: (channels: Record<string, boolean>) => commSettingsApi.updateChannels(channels),
  updateNotifications: (settings: Record<string, unknown>) => commSettingsApi.updateNotifications(settings),
  updatePrivacy: (settings: Record<string, unknown>) => commSettingsApi.updatePrivacy(settings),
};
