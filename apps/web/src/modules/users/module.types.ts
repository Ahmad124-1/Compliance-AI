/**
 * Users module types.
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

export type { InviteInput } from './module.validation.js';
