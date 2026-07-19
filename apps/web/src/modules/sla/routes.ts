import { SLA_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const slaRoutesMap: AppRoute[] = [
  { path: SLA_ROUTES.definitions, permission: ['sla:read'], label: 'SLA Definitions' },
  { path: SLA_ROUTES.instances, permission: ['sla:read'], label: 'SLA Instances' },
  { path: SLA_ROUTES.workingHours, permission: ['sla:read'], label: 'Working Hours' },
];

export function findSlaRoute(path: string): AppRoute | undefined {
  return slaRoutesMap.find((r) => r.path === path);
}
