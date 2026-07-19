/**
 * Auth module domain types (mirrors API Session shape).
 */

export type UserStatus = 'invited' | 'active' | 'disabled';

export interface PublicUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string;
  preferences: Record<string, unknown>;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: 'consultancy' | 'client';
  logoUrl: string | null;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
  organization: Organization;
  roles: string[];
  permissions: string[];
}

export interface AuthClaims {
  sub: string;
  org: string;
  email: string;
  roles: string[];
  perms: string[];
}
