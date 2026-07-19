import { pool } from './pool.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { userRepo } from '../repositories/user.repo.js';
import { roleRepo, permissionRepo } from '../repositories/rbac.repo.js';
import { password } from '../core/password.js';
import { slugify } from '../core/crypto.js';
import { env } from '../config/env.js';

/**
 * Seed a consultancy tenant + superadmin user + full-permission admin role.
 * Idempotent.
 */
export async function seed(): Promise<void> {
  const consultancyName = 'ComplianceOS Consultancy';
  let consultancy = await organizationRepo.findBySlug(slugify(consultancyName));
  if (!consultancy) {
    consultancy = await organizationRepo.create({ name: consultancyName, slug: slugify(consultancyName), kind: 'consultancy' });
    console.log('[seed] consultancy created', consultancy.id);
  }

  const adminEmail = 'admin@complianceos.ai';
  let admin = await userRepo.findByEmail(adminEmail);
  if (!admin) {
    const hash = await password.hash(env.JWT_SECRET === 'dev-insecure-secret-change-me' ? 'SuperAdmin123!' : 'SuperAdmin123!');
    admin = await userRepo.create({
      organizationId: consultancy.id,
      email: adminEmail,
      passwordHash: hash,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'active',
      emailVerified: true,
    });
    console.log('[seed] superadmin created', admin.id);
  }

  const allPerms = await permissionRepo.list();
  let adminRole = await roleRepo.findByKey(consultancy.id, 'superadmin');
  if (!adminRole) {
    adminRole = await roleRepo.create(consultancy.id, 'Super Admin', 'superadmin', {
      description: 'Full platform access',
      isSystem: true,
    });
    for (const p of allPerms) await roleRepo.assignPermission(adminRole.id, p.id);
    console.log('[seed] superadmin role created');
  }

  await userRepo.assignRole(admin.id, adminRole.id, consultancy.id, admin.id);
  console.log('[seed] done');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => pool.end())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
