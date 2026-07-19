import { AUTH_ROUTES } from './module.constants.js';

export interface AppRoute {
  path: string;
  /** Required permission keys (any-of) to access; empty = authenticated only. */
  permission?: string[];
  /** Mark as public (no auth required). */
  public?: boolean;
  label?: string;
}

/**
 * Auth-related route map. Used by route guards and navigation.
 */
export const authRoutesMap: AppRoute[] = [
  { path: AUTH_ROUTES.login, public: true, label: 'Login' },
  { path: AUTH_ROUTES.register, public: true, label: 'Register' },
  { path: AUTH_ROUTES.forgotPassword, public: true, label: 'Forgot Password' },
  { path: AUTH_ROUTES.resetPassword, public: true, label: 'Reset Password' },
  { path: AUTH_ROUTES.profile, permission: ['profile:read', 'profile:update', 'user:update'], label: 'Profile' },
];

export function findRoute(path: string): AppRoute | undefined {
  return authRoutesMap.find((r) => r.path === path);
}
