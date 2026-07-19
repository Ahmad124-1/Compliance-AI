import { NOTIFICATION_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const notificationRoutesMap: AppRoute[] = [
  { path: NOTIFICATION_ROUTES.list, permission: ['notification:read'], label: 'Notifications' },
];

export function findNotificationRoute(path: string): AppRoute | undefined {
  return notificationRoutesMap.find((r) => r.path === path);
}
