import { ConflictError, NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo, type OrganizationInput } from '../repositories/organization.repo.js';
import { slugify } from '../core/crypto.js';
import type { Organization } from '../types/index.js';

export const organizationService = {
  async create(input: OrganizationInput, actorId?: string): Promise<Organization> {
    const slug = input.slug ?? slugify(input.name);
    const existing = await organizationRepo.findBySlug(slug);
    if (existing) throw new ConflictError('Organization slug already exists');
    const org = await organizationRepo.create({ ...input, slug });
    await audit({ organizationId: org.id, actorId: actorId ?? null, action: 'org.create', entity: 'organization', entityId: org.id });
    return org;
  },

  async get(id: string): Promise<Organization> {
    const org = await organizationRepo.findById(id);
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  },

  async list(): Promise<Organization[]> {
    return organizationRepo.list();
  },

  async update(id: string, patch: Partial<OrganizationInput & { isActive: boolean }>, actorId?: string): Promise<Organization> {
    const updated = await organizationRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Organization not found');
    await audit({ organizationId: id, actorId: actorId ?? null, action: 'org.update', entity: 'organization', entityId: id });
    return updated;
  },

  async remove(id: string, actorId?: string): Promise<void> {
    await organizationRepo.remove(id);
    await audit({ organizationId: id, actorId: actorId ?? null, action: 'org.delete', entity: 'organization', entityId: id });
  },
};
