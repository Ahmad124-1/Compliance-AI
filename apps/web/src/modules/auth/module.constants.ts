/**
 * Auth module endpoints, route paths, and storage keys.
 */
export const AUTH_ENDPOINTS = {
  register: '/api/v1/auth/register',
  login: '/api/v1/auth/login',
  refresh: '/api/v1/auth/refresh',
  logout: '/api/v1/auth/logout',
  forgotPassword: '/api/v1/auth/forgot-password',
  resetPassword: '/api/v1/auth/reset-password',
  changePassword: '/api/v1/auth/change-password',
  verifyEmail: '/api/v1/auth/verify-email',
  me: '/api/v1/auth/me',
} as const;

export const AUTH_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  register: '/register',
  logout: '/logout',
  profile: '/settings/profile',
} as const;

/** Client routes gated by authentication. */
export const PROTECTED_ROUTES = ['/dashboard', '/settings', '/admin'] as const;
