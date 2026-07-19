import { QUEUE_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const queueRoutesMap: AppRoute[] = [
  { path: QUEUE_ROUTES.dashboard, permission: ['queue:read'], label: 'Queue' },
];

export function findQueueRoute(path: string): AppRoute | undefined {
  return queueRoutesMap.find((r) => r.path === path);
}
