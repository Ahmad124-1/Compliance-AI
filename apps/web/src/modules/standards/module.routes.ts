import { STANDARDS_ROUTES } from './module.constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const standardsRoutesMap: AppRoute[] = [
  { path: STANDARDS_ROUTES.dashboard, permission: ['standard:read'], label: 'Standards' },
  { path: STANDARDS_ROUTES.library, permission: ['standard:read'], label: 'Standards Library' },
];

export function findStandardRoute(path: string): AppRoute | undefined {
  return standardsRoutesMap.find((r) => r.path === path);
}
