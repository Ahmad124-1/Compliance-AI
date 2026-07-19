import { COMM_SETTINGS_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const commSettingsRoutesMap: AppRoute[] = [
  { path: COMM_SETTINGS_ROUTES.settings, permission: ['organization:read'], label: 'Communication Settings' },
];

export function findCommSettingsRoute(path: string): AppRoute | undefined {
  return commSettingsRoutesMap.find((r) => r.path === path);
}
