import { BadRequestError, NotFoundError } from '../core/errors.js';
import { randomToken } from '../core/crypto.js';
import { audit } from '../core/audit.js';
import { userRepo } from '../repositories/user.repo.js';
import { roleRepo } from '../repositories/rbac.repo.js';
import type { PublicUser, User } from '../types/index.js';

function toPublic(u: User): PublicUser {
  const { passwordHash: _pw, ...rest } = u;
  return rest;
}

export interface InviteInput {
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  siteId?: string;
  departmentId?: string;
  teamId?: string;
  invitedBy?: string;
}

export const userService = {
  async list(orgId: string): Promise<PublicUser[]> {
    const users = await userRepo.listByOrganization(orgId);
    return users.map(toPublic);
  },

  async getById(orgId: string, id: string): Promise<PublicUser> {
    const user = await userRepo.findById(id);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    return toPublic(user);
  },

  async invite(input: InviteInput): Promise<PublicUser> {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new BadRequestError('User already exists');
    const token = randomToken();
    const user = await userRepo.create({
      organizationId: input.organizationId,
      email: input.email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      status: 'invited',
      emailVerificationToken: token,
      emailVerificationExpiresAt: new Date(Date.now() + 7 * 86_400_000),
    });
    if (input.roleId) await userRepo.assignRole(user.id, input.roleId, input.organizationId, input.invitedBy ?? null);
    if (input.siteId || input.departmentId || input.teamId) {
      await userRepo.addMembership(user.id, input.organizationId, {
        siteId: input.siteId ?? null,
        departmentId: input.departmentId ?? null,
        teamId: input.teamId ?? null,
      });
    }
    await audit({ organizationId: input.organizationId, actorId: input.invitedBy ?? null, action: 'user.invite', entity: 'user', entityId: user.id });
    return toPublic(user);
  },

  async activate(orgId: string, id: string, actorId?: string): Promise<PublicUser> {
    const user = await userRepo.findById(id);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    const updated = await userRepo.update(id, { status: 'active' });
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'user.activate', entity: 'user', entityId: id });
    return toPublic(updated!);
  },

  async disable(orgId: string, id: string, actorId?: string): Promise<PublicUser> {
    const user = await userRepo.findById(id);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    const updated = await userRepo.update(id, { status: 'disabled' });
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'user.disable', entity: 'user', entityId: id });
    return toPublic(updated!);
  },

  async updateProfile(
    orgId: string,
    id: string,
    patch: { firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; preferences?: Record<string, unknown> },
  ): Promise<PublicUser> {
    const user = await userRepo.findById(id);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    const updated = await userRepo.update(id, patch);
    return toPublic(updated!);
  },

  async assignRole(orgId: string, userId: string, roleId: string, actorId?: string): Promise<void> {
    const role = await roleRepo.findById(roleId);
    if (!role || role.organizationId !== orgId) throw new NotFoundError('Role not found');
    await userRepo.assignRole(userId, roleId, orgId, actorId ?? null);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'user.role.assign', entity: 'user', entityId: userId });
  },

  async unassignRole(orgId: string, userId: string, roleId: string): Promise<void> {
    await userRepo.unassignRole(userId, roleId, orgId);
  },

  async resendInvite(orgId: string, id: string): Promise<void> {
    const user = await userRepo.findById(id);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    await userRepo.update(id, {
      emailVerificationToken: randomToken(),
      emailVerificationExpiresAt: new Date(Date.now() + 7 * 86_400_000),
    });
  },
};
