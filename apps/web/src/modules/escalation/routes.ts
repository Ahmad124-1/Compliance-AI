import { ESCALATION_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const escalationRoutesMap: AppRoute[] = [
  { path: ESCALATION_ROUTES.rules, permission: ['escalation:read'], label: 'Escalation Rules' },
  { path: ESCALATION_ROUTES.levels, permission: ['escalation:read'], label: 'Escalation Levels' },
];

export function findEscalationRoute(path: string): AppRoute | undefined {
  return escalationRoutesMap.find((r) => r.path === path);
}
