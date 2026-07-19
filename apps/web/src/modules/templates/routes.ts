import { TEMPLATE_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const templateRoutesMap: AppRoute[] = [
  { path: TEMPLATE_ROUTES.list, permission: ['template:read'], label: 'Templates' },
  { path: TEMPLATE_ROUTES.create, permission: ['template:create'], label: 'New Template' },
];

export function findTemplateRoute(path: string): AppRoute | undefined {
  return templateRoutesMap.find((r) => r.path === path);
}
