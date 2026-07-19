import { GRIEVANCE_ROUTES } from './module.constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const grievancesRoutesMap: AppRoute[] = [
  { path: GRIEVANCE_ROUTES.submit, public: true, label: 'Submit Grievance' },
  { path: GRIEVANCE_ROUTES.track, public: true, label: 'Track Grievance' },
  { path: GRIEVANCE_ROUTES.list, permission: ['grievance:read'], label: 'Grievances' },
  { path: GRIEVANCE_ROUTES.categories, permission: ['grievance:read'], label: 'Categories' },
  { path: GRIEVANCE_ROUTES.portalConfig, permission: ['grievance:read'], label: 'Portal Config' },
  { path: GRIEVANCE_ROUTES.qrPortals, permission: ['grievance:read'], label: 'QR Portals' },
];

export function findGrievanceRoute(path: string): AppRoute | undefined {
  return grievancesRoutesMap.find((r) => r.path === path);
}
