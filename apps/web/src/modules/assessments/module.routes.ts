import { ASSESSMENT_ROUTES } from './module.constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const assessmentsRoutesMap: AppRoute[] = [
  { path: ASSESSMENT_ROUTES.dashboard, permission: ['assessment:read'], label: 'Assessments' },
  { path: ASSESSMENT_ROUTES.templates, permission: ['assessment:read'], label: 'Templates' },
  { path: ASSESSMENT_ROUTES.library, permission: ['assessment:read'], label: 'Template Library' },
];

export function findAssessmentRoute(path: string): AppRoute | undefined {
  return assessmentsRoutesMap.find((r) => r.path === path);
}
