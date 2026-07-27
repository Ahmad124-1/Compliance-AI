import { WORKER_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  label?: string;
}

export const workerRoutesMap: AppRoute[] = [
  { path: WORKER_ROUTES.overview, permission: ['profile:read'], label: 'Overview' },
  { path: WORKER_ROUTES.profile, permission: ['profile:read'], label: 'My Profile' },
  { path: WORKER_ROUTES.directory, permission: ['user:read'], label: 'Worker Directory' },
  { path: WORKER_ROUTES.announcements, permission: ['organization:read'], label: 'Announcements' },
  { path: WORKER_ROUTES.tasks, permission: ['profile:read'], label: 'My Tasks' },
  { path: WORKER_ROUTES.documents, permission: ['profile:read'], label: 'Documents' },
  { path: WORKER_ROUTES.forms, permission: ['profile:read'], label: 'Forms' },
  { path: WORKER_ROUTES.learning, permission: ['profile:read'], label: 'Learning Center' },
  { path: WORKER_ROUTES.support, permission: ['profile:read'], label: 'Support Center' },
  { path: WORKER_ROUTES.settings, permission: ['profile:read'], label: 'Settings' },
];

export function findWorkerRoute(path: string): AppRoute | undefined {
  return workerRoutesMap.find((r) => r.path === path);
}
