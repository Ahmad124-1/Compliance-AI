import { CASE_ROUTES } from './module.constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const casesRoutesMap: AppRoute[] = [
  { path: CASE_ROUTES.list, permission: ['case:read'], label: 'Cases' },
  { path: CASE_ROUTES.create, permission: ['case:create'], label: 'New Case' },
];

export function findCaseRoute(path: string): AppRoute | undefined {
  return casesRoutesMap.find((r) => r.path === path);
}
