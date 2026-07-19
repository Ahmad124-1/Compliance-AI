import { env } from '../config/env.js';
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError } from '../core/errors.js';
import { password as pw } from '../core/password.js';
import { randomToken, sha256, slugify } from '../core/crypto.js';
import { audit } from '../core/audit.js';
import { userRepo } from '../repositories/user.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { roleRepo } from '../repositories/rbac.repo.js';
import { rbacService } from './rbac.service.js';
import type { FastifyInstance } from 'fastify';
import type { Session, User } from '../types/index.js';
import type { TokenService } from '../core/tokens.js';

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
}

export const authService = {
  /**
   * Build a Session object (tokens + public user) for a user + active org.
   */
  async buildSession(app: FastifyInstance, user: User, orgId: string): Promise<Session> {
    const tokens = app.tokenService as TokenService;
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const roles = await userRepo.getUserRoles(user.id, orgId);
    const permissions = await rbacService.resolvePermissions(roles);
    const accessToken = tokens.signAccess({
      sub: user.id,
      org: org.id,
      email: user.email,
      roles: roles.map((r) => r.key),
      perms: permissions.map((p) => p.key),
    });
    const refreshToken = await tokens.issueRefresh(user.id);
    const expiresIn = parseTtl(env.ACCESS_TOKEN_TTL);
    const { passwordHash: _pw, ...publicUser } = user;
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: publicUser,
      organization: org,
      roles: roles.map((r) => r.key),
      permissions: permissions.map((p) => p.key),
    };
  },

  async register(app: FastifyInstance, input: RegisterInput): Promise<Session> {
    if (!env.ENABLE_REGISTRATION) throw new ForbiddenError('Registration is disabled');
    if (!pw.isStrong(input.password)) {
      throw new BadRequestError(
        'Password must be at least 10 characters and include upper, lower, digit and symbol.',
      );
    }
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new BadRequestError('Email already registered');

    const slug = slugify(input.organizationName) || slugify(input.email.split('@')[0]);
    const org = await organizationRepo.create({ name: input.organizationName, slug, kind: 'client' });
    const hash = await pw.hash(input.password);
    const verifyToken = randomToken();
    const user = await userRepo.create({
      organizationId: org.id,
      email: input.email,
      passwordHash: hash,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      status: 'active',
      emailVerified: false,
      emailVerificationToken: verifyToken,
      emailVerificationExpiresAt: new Date(Date.now() + 86_400_000),
    });

    // Owner role with full permissions.
    const ownerRole = await roleRepo.create(org.id, 'Owner', 'owner', {
      description: 'Organization owner',
      isSystem: true,
    });
    const perms = await (await import('../repositories/rbac.repo.js')).permissionRepo.list();
    for (const p of perms) await roleRepo.assignPermission(ownerRole.id, p.id);
    await userRepo.assignRole(user.id, ownerRole.id, org.id, user.id);

    await audit({ organizationId: org.id, actorId: user.id, action: 'user.register', entity: 'user', entityId: user.id });
    return this.buildSession(app, user, org.id);
  },

  async login(app: FastifyInstance, email: string, password: string): Promise<Session> {
    const user = await userRepo.findByEmail(email);
    if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid credentials');
    if (user.status === 'disabled') throw new ForbiddenError('Account disabled');
    const ok = await pw.verify(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');
    if (!user.emailVerified) {
      // allow login but flag; for now permit.
    }
    await userRepo.update(user.id, { lastLoginAt: new Date(), status: user.status === 'invited' ? 'active' : user.status });
    const session = await this.buildSession(app, user, user.organizationId);
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'user.login', entity: 'user', entityId: user.id });
    return session;
  },

  async refresh(app: FastifyInstance, rawRefresh: string): Promise<Session> {
    const tokens = app.tokenService as TokenService;
    const { userId } = await tokens.rotateRefresh(rawRefresh);
    const user = await userRepo.findById(userId);
    if (!user || user.status === 'disabled') throw new UnauthorizedError('Invalid session');
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'token.refresh', entity: 'user', entityId: user.id });
    return this.buildSession(app, user, user.organizationId);
  },

  async logout(app: FastifyInstance, rawRefresh: string | undefined): Promise<void> {
    const tokens = app.tokenService as TokenService;
    if (rawRefresh) await tokens.revoke(rawRefresh);
  },

  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepo.findByEmail(email);
    if (!user) return; // do not reveal existence
    const token = randomToken();
    await userRepo.update(user.id, {
      passwordResetToken: sha256(token),
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'password.reset.request', entity: 'user', entityId: user.id });
    // Token returned for dev/mailer wiring; in production send email.
    return;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!pw.isStrong(newPassword)) throw new BadRequestError('Password too weak');
    const user = await userRepo.findByResetToken(sha256(token));
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Invalid or expired token');
    }
    const hash = await pw.hash(newPassword);
    await userRepo.update(user.id, {
      passwordHash: hash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      emailVerified: true,
      status: user.status === 'invited' ? 'active' : user.status,
    });
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'password.reset', entity: 'user', entityId: user.id });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepo.findById(userId);
    if (!user || !user.passwordHash) throw new NotFoundError('User not found');
    if (!pw.isStrong(newPassword)) throw new BadRequestError('Password too weak');
    const ok = await pw.verify(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestError('Current password is incorrect');
    const hash = await pw.hash(newPassword);
    await userRepo.update(user.id, { passwordHash: hash });
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'password.change', entity: 'user', entityId: user.id });
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await userRepo.findByVerificationToken(token);
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Invalid or expired verification token');
    }
    await userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      status: user.status === 'invited' ? 'active' : user.status,
    });
    await audit({ organizationId: user.organizationId, actorId: user.id, action: 'email.verify', entity: 'user', entityId: user.id });
  },
};

function parseTtl(ttl: string): number {
  const m = ttl.match(/^(\d+)([smh])$/);
  if (!m) return 900;
  const n = Number(m[1]);
  const unit = m[2];
  return unit === 's' ? n : unit === 'm' ? n * 60 : n * 3600;
}
