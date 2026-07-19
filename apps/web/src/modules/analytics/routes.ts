import { ANALYTICS_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const analyticsRoutesMap: AppRoute[] = [
  { path: ANALYTICS_ROUTES.dashboard, permission: ['analytics:read'], label: 'Analytics' },
];

export function findAnalyticsRoute(path: string): AppRoute | undefined {
  return analyticsRoutesMap.find((r) => r.path === path);
}
