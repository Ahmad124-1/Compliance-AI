import { query } from '../db/pool.js';
import type { Organization } from '../types/index.js';

export interface OrganizationInput {
  name: string;
  slug: string;
  kind?: 'consultancy' | 'client';
  logoUrl?: string | null;
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

function mapOrganization(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    kind: row.kind,
    logoUrl: row.logo_url,
    branding: row.branding,
    settings: row.settings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const organizationRepo = {
  async create(input: OrganizationInput): Promise<Organization> {
    const { rows } = await query<Organization>(
      `INSERT INTO organizations (name, slug, kind, logo_url, branding, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.name,
        input.slug,
        input.kind ?? 'client',
        input.logoUrl ?? null,
        JSON.stringify(input.branding ?? {}),
        JSON.stringify(input.settings ?? {}),
      ],
    );
    return mapOrganization(rows[0]);
  },

  async findById(id: string): Promise<Organization | null> {
    const { rows } = await query(`SELECT * FROM organizations WHERE id = $1`, [id]);
    return rows[0] ? mapOrganization(rows[0]) : null;
  },

  async findBySlug(slug: string): Promise<Organization | null> {
    const { rows } = await query(`SELECT * FROM organizations WHERE slug = $1`, [slug]);
    return rows[0] ? mapOrganization(rows[0]) : null;
  },

  async list(): Promise<Organization[]> {
    const { rows } = await query(`SELECT * FROM organizations ORDER BY created_at DESC`);
    return rows.map(mapOrganization);
  },

  async update(
    id: string,
    patch: Partial<{
      name: string;
      slug: string;
      logoUrl: string | null;
      branding: Record<string, unknown>;
      settings: Record<string, unknown>;
      isActive: boolean;
    }>,
  ): Promise<Organization | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.slug !== undefined) set('slug', patch.slug);
    if (patch.logoUrl !== undefined) set('logo_url', patch.logoUrl);
    if (patch.branding !== undefined) set('branding', JSON.stringify(patch.branding));
    if (patch.settings !== undefined) set('settings', JSON.stringify(patch.settings));
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (sets.length === 0) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(
      `UPDATE organizations SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] ? mapOrganization(rows[0]) : null;
  },

  async remove(id: string): Promise<void> {
    await query(`DELETE FROM organizations WHERE id = $1`, [id]);
  },
};
