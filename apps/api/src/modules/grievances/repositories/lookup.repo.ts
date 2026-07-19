import { query } from '../../../db/pool.js';
import type { GrievanceCategory, ComplaintSource, GrievanceChannel, Language, WorkerPortalConfiguration, QRPortal } from '../types.js';

function mapCategory(row: any): GrievanceCategory {
  return { id: row.id, organizationId: row.organization_id, name: row.name, code: row.code, isActive: row.is_active, createdAt: row.created_at };
}

function mapSource(row: any): ComplaintSource {
  return { id: row.id, name: row.name, code: row.code, isActive: row.is_active, createdAt: row.created_at };
}

function mapChannel(row: any): GrievanceChannel {
  return { id: row.id, name: row.name, code: row.code, isActive: row.is_active, createdAt: row.created_at };
}

function mapLanguage(row: any): Language {
  return { id: row.id, code: row.code, name: row.name, isActive: row.is_active, createdAt: row.created_at };
}

function mapPortalConfig(row: any): WorkerPortalConfiguration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    theme: row.theme,
    languages: row.languages,
    customText: row.custom_text,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQRPortal(row: any): QRPortal {
  return {
    id: row.id,
    organizationId: row.organization_id,
    portalUrl: row.portal_url,
    configuration: row.configuration,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const categoryRepo = {
  async list(organizationId?: string): Promise<GrievanceCategory[]> {
    const { rows } = organizationId
      ? await query(`SELECT * FROM grievance_categories WHERE organization_id = $1 AND is_active = TRUE ORDER BY name`, [organizationId])
      : await query(`SELECT * FROM grievance_categories WHERE organization_id IS NULL AND is_active = TRUE ORDER BY name`);
    return rows.map(mapCategory);
  },

  async create(input: { organizationId?: string | null; name: string; code: string }): Promise<GrievanceCategory> {
    const { rows } = await query<GrievanceCategory>(
      `INSERT INTO grievance_categories (organization_id, name, code) VALUES ($1, $2, $3) RETURNING *`,
      [input.organizationId ?? null, input.name, input.code],
    );
    return mapCategory(rows[0]);
  },

  async findById(id: string): Promise<GrievanceCategory | null> {
    const { rows } = await query(`SELECT * FROM grievance_categories WHERE id = $1`, [id]);
    return rows[0] ? mapCategory(rows[0]) : null;
  },
};

export const sourceRepo = {
  async list(): Promise<ComplaintSource[]> {
    const { rows } = await query(`SELECT * FROM complaint_sources WHERE is_active = TRUE ORDER BY name`);
    return rows.map(mapSource);
  },

  async create(input: { name: string; code: string }): Promise<ComplaintSource> {
    const { rows } = await query<ComplaintSource>(
      `INSERT INTO complaint_sources (name, code) VALUES ($1, $2) RETURNING *`,
      [input.name, input.code],
    );
    return mapSource(rows[0]);
  },

  async findById(id: string): Promise<ComplaintSource | null> {
    const { rows } = await query(`SELECT * FROM complaint_sources WHERE id = $1`, [id]);
    return rows[0] ? mapSource(rows[0]) : null;
  },
};

export const channelRepo = {
  async list(): Promise<GrievanceChannel[]> {
    const { rows } = await query(`SELECT * FROM grievance_channels WHERE is_active = TRUE ORDER BY name`);
    return rows.map(mapChannel);
  },

  async create(input: { name: string; code: string }): Promise<GrievanceChannel> {
    const { rows } = await query<GrievanceChannel>(
      `INSERT INTO grievance_channels (name, code) VALUES ($1, $2) RETURNING *`,
      [input.name, input.code],
    );
    return mapChannel(rows[0]);
  },
};

export const languageRepo = {
  async list(): Promise<Language[]> {
    const { rows } = await query(`SELECT * FROM languages WHERE is_active = TRUE ORDER BY name`);
    return rows.map(mapLanguage);
  },

  async create(input: { code: string; name: string }): Promise<Language> {
    const { rows } = await query<Language>(
      `INSERT INTO languages (code, name) VALUES ($1, $2) RETURNING *`,
      [input.code, input.name],
    );
    return mapLanguage(rows[0]);
  },

  async findByCode(code: string): Promise<Language | null> {
    const { rows } = await query(`SELECT * FROM languages WHERE code = $1`, [code]);
    return rows[0] ? mapLanguage(rows[0]) : null;
  },
};

export const portalConfigRepo = {
  async findByOrganization(organizationId: string): Promise<WorkerPortalConfiguration | null> {
    const { rows } = await query(`SELECT * FROM worker_portal_configurations WHERE organization_id = $1`, [organizationId]);
    return rows[0] ? mapPortalConfig(rows[0]) : null;
  },

  async upsert(input: { organizationId: string; theme?: Record<string, unknown>; languages?: string[]; customText?: Record<string, unknown> }): Promise<WorkerPortalConfiguration> {
    const { rows } = await query<WorkerPortalConfiguration>(
      `INSERT INTO worker_portal_configurations (organization_id, theme, languages, custom_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         languages = EXCLUDED.languages,
         custom_text = EXCLUDED.custom_text,
         updated_at = now()
       RETURNING *`,
      [input.organizationId, JSON.stringify(input.theme ?? {}), JSON.stringify(input.languages ?? []), JSON.stringify(input.customText ?? {})],
    );
    return mapPortalConfig(rows[0]);
  },
};

export const qrPortalRepo = {
  async listByOrganization(organizationId: string): Promise<QRPortal[]> {
    const { rows } = await query(`SELECT * FROM qr_portals WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows.map(mapQRPortal);
  },

  async create(input: { organizationId: string; portalUrl: string; configuration?: Record<string, unknown> }): Promise<QRPortal> {
    const { rows } = await query<QRPortal>(
      `INSERT INTO qr_portals (organization_id, portal_url, configuration) VALUES ($1, $2, $3) RETURNING *`,
      [input.organizationId, input.portalUrl, JSON.stringify(input.configuration ?? {})],
    );
    return mapQRPortal(rows[0]);
  },

  async findById(id: string): Promise<QRPortal | null> {
    const { rows } = await query(`SELECT * FROM qr_portals WHERE id = $1`, [id]);
    return rows[0] ? mapQRPortal(rows[0]) : null;
  },
};
