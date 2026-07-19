import { WORKER_COMM_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const workerCommRoutesMap: AppRoute[] = [
  { path: WORKER_COMM_ROUTES.list, permission: ['case:read'], label: 'Worker Communication' },
  { path: WORKER_COMM_ROUTES.timeline(':caseId'), permission: ['case:read'], label: 'Worker Timeline' },
];

export function findWorkerCommRoute(path: string): AppRoute | undefined {
  return workerCommRoutesMap.find((r) => r.path === path);
}
