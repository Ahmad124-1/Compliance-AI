import { query } from '../db/pool.js';

export type SearchScope =
  | 'all'
  | 'complaints'
  | 'cases'
  | 'tracking'
  | 'factories'
  | 'departments'
  | 'organizations'
  | 'investigators'
  | 'categories'
  | 'notifications'
  | 'qr_codes'
  | 'templates'
  | 'assessment_templates'
  | 'assessments';

export type SearchSortField = 'relevance' | 'created_at' | 'updated_at' | 'title' | 'name' | 'status';

export interface SearchFilters {
  status?: string;
  priority?: string;
  severity?: string;
  category?: string;
  source?: string;
  anonymous?: boolean;
  dateFrom?: string;
  dateTo?: string;
  factoryId?: string;
  departmentId?: string;
  assignedTo?: string;
}

export interface SearchParams {
  organizationId: string;
  scope: SearchScope;
  term: string;
  filters?: SearchFilters;
  sortField?: SearchSortField;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchHit {
  id: string;
  scope: string;
  title: string;
  subtitle: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string | null;
  url: string;
  metadata: Record<string, unknown>;
}

interface RawHit {
  id: string;
  scope: string;
  title: string;
  subtitle: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  created_at: Date;
  updated_at: Date | null;
  metadata: Record<string, unknown>;
}

const SCOPE_TABLES: Record<Exclude<SearchScope, 'all'>, string> = {
  complaints: 'grievances',
  cases: 'cases',
  tracking: 'grievances',
  factories: 'sites',
  departments: 'departments',
  organizations: 'organizations',
  investigators: 'investigators',
  categories: 'grievance_categories',
  notifications: 'notifications',
  qr_codes: 'qr_codes',
  templates: 'message_templates',
  assessment_templates: 'assessment_templates',
  assessments: 'assessments',
};

function buildUrl(scope: string, id: string, metadata: Record<string, unknown>): string {
  switch (scope) {
    case 'complaints':
    case 'tracking':
      return `/track-grievance?n=${(metadata.trackingNumber as string) ?? ''}`;
    case 'cases':
      return `/dashboard/admin/cases/${id}`;
    case 'factories':
      return `/dashboard/admin/sites/${id}`;
    case 'departments':
      return `/dashboard/admin/sites`;
    case 'organizations':
      return `/dashboard/admin/organizations/${id}`;
    case 'investigators':
      return `/dashboard/admin/cases`;
    case 'categories':
      return `/dashboard/admin/grievances/categories`;
    case 'notifications':
      return `/dashboard`;
    case 'qr_codes':
      return `/dashboard/qr-codes/${id}`;
    case 'templates':
      return `/dashboard/communication-settings`;
    case 'assessment_templates':
      return `/assessments/templates/${id}`;
    case 'assessments':
      return `/assessments/${id}`;
    default:
      return '/dashboard';
  }
}

const SORT_COLUMN: Record<SearchSortField, string> = {
  relevance: 'relevance',
  created_at: 'created_at',
  updated_at: 'updated_at',
  title: 'title',
  name: 'title',
  status: 'status',
};

export const searchRepo = {
  async search(params: SearchParams): Promise<{ hits: SearchHit[]; total: number }> {
    const { organizationId, term, scope, filters = {}, sortField = 'relevance', sortDir = 'desc', limit = 25, offset = 0 } = params;

    const scopes = scope === 'all' ? (Object.keys(SCOPE_TABLES) as Array<Exclude<SearchScope, 'all'>>) : [scope as Exclude<SearchScope, 'all'>];

    const termIdx = 1;
    const orgIdx = 2;
    const baseParams: unknown[] = [term, organizationId];

    const selects: string[] = [];

    for (const s of scopes) {
      const table = SCOPE_TABLES[s];
      const clauses: string[] = [`${table}.organization_id = $${orgIdx}`, `(${table}.is_deleted IS NULL OR ${table}.is_deleted = FALSE)`];

      const add = (clause: string, val: unknown) => {
        const idx = baseParams.length + 1;
        clauses.push(clause.replace('$?', `$${idx}`));
        baseParams.push(val);
      };

      if (filters.status) add(`${table}.status = $?`, filters.status);
      if (filters.priority) add(`${table}.priority = $?`, filters.priority);
      if (filters.severity) add(`${table}.severity = $?`, filters.severity);
      if (filters.category) add(`${table}.category = $?`, filters.category);
      if (filters.source) add(`${table}.source = $?`, filters.source);
      if (filters.anonymous !== undefined) add(`${table}.anonymous = $?`, filters.anonymous);
      if (filters.factoryId) add(`${table}.factory_id = $?`, filters.factoryId);
      if (filters.departmentId) add(`${table}.department_id = $?`, filters.departmentId);
      if (filters.assignedTo) add(`$? = ANY(${table}.assigned_to)`, filters.assignedTo);
      if (filters.dateFrom) add(`${table}.created_at >= $?`, filters.dateFrom);
      if (filters.dateTo) add(`${table}.created_at <= $?`, filters.dateTo);

      const termMatch = `$${termIdx}`;
      const where = clauses.join(' AND ');

      switch (s) {
        case 'complaints':
          selects.push(`
            SELECT g.id, 'complaints' AS scope, g.title, COALESCE(g.factory, g.department, 'Worker report') AS subtitle,
              g.status, g.priority, g.category, g.created_at, g.updated_at,
              CASE WHEN g.title ILIKE '%' || ${termMatch} || '%' THEN 3
                   WHEN g.description ILIKE '%' || ${termMatch} || '%' THEN 2
                   WHEN g.tracking_number ILIKE '%' || ${termMatch} || '%' THEN 4 ELSE 1 END AS relevance,
              jsonb_build_object('trackingNumber', g.tracking_number, 'anonymous', g.anonymous, 'source', g.source) AS metadata
            FROM grievances g
            WHERE ${where}
              AND (g.title ILIKE '%' || ${termMatch} || '%' OR g.description ILIKE '%' || ${termMatch} || '%'
                   OR g.tracking_number ILIKE '%' || ${termMatch} || '%' OR g.factory ILIKE '%' || ${termMatch} || '%'
                   OR g.department ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'tracking':
          selects.push(`
            SELECT g.id, 'tracking' AS scope, g.tracking_number AS title, g.title AS subtitle,
              g.status, g.priority, g.category, g.created_at, g.updated_at, 5 AS relevance,
              jsonb_build_object('anonymous', g.anonymous, 'source', g.source) AS metadata
            FROM grievances g
            WHERE ${where} AND g.tracking_number ILIKE '%' || ${termMatch} || '%'`);
          break;
        case 'cases':
          selects.push(`
            SELECT c.id, 'cases' AS scope, c.title, COALESCE(c.case_number, '') AS subtitle,
              c.status, c.priority, c.category, c.created_at, c.updated_at,
              CASE WHEN c.title ILIKE '%' || ${termMatch} || '%' THEN 3
                   WHEN c.description ILIKE '%' || ${termMatch} || '%' THEN 2
                   WHEN c.case_number ILIKE '%' || ${termMatch} || '%' THEN 4 ELSE 1 END AS relevance,
              jsonb_build_object('caseNumber', c.case_number, 'anonymous', c.reporter_anonymous) AS metadata
            FROM cases c
            WHERE ${where}
              AND (c.title ILIKE '%' || ${termMatch} || '%' OR c.description ILIKE '%' || ${termMatch} || '%'
                   OR c.case_number ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'factories':
          selects.push(`
            SELECT s.id, 'factories' AS scope, s.name AS title, COALESCE(s.country, '') AS subtitle,
              s.status, NULL AS priority, NULL AS category, s.created_at, s.updated_at,
              CASE WHEN s.name ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('country', s.country, 'code', s.code) AS metadata
            FROM sites s
            WHERE ${where} AND (s.name ILIKE '%' || ${termMatch} || '%' OR s.code ILIKE '%' || ${termMatch} || '%' OR s.country ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'departments':
          selects.push(`
            SELECT d.id, 'departments' AS scope, d.name AS title, COALESCE(d.code, '') AS subtitle,
              NULL AS status, NULL AS priority, NULL AS category, d.created_at, d.updated_at,
              CASE WHEN d.name ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('code', d.code) AS metadata
            FROM departments d
            WHERE ${where} AND (d.name ILIKE '%' || ${termMatch} || '%' OR d.code ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'organizations':
          selects.push(`
            SELECT o.id, 'organizations' AS scope, o.name AS title, COALESCE(o.slug, '') AS subtitle,
              NULL AS status, NULL AS priority, NULL AS category, o.created_at, o.updated_at,
              CASE WHEN o.name ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('slug', o.slug, 'kind', o.kind) AS metadata
            FROM organizations o
            WHERE ${where} AND (o.name ILIKE '%' || ${termMatch} || '%' OR o.slug ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'investigators':
          selects.push(`
            SELECT i.id, 'investigators' AS scope,
              COALESCE(u.first_name || ' ' || u.last_name, u.email) AS title,
              COALESCE(i.badge_number, i.specialization, '') AS subtitle,
              NULL AS status, NULL AS priority, NULL AS category, i.created_at, i.updated_at,
              CASE WHEN (u.first_name || ' ' || u.last_name) ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('badgeNumber', i.badge_number, 'specialization', i.specialization) AS metadata
            FROM investigators i JOIN users u ON u.id = i.user_id
            WHERE ${where} AND (u.first_name ILIKE '%' || ${termMatch} || '%' OR u.last_name ILIKE '%' || ${termMatch} || '%'
                   OR u.email ILIKE '%' || ${termMatch} || '%' OR i.badge_number ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'categories':
          selects.push(`
            SELECT gc.id, 'categories' AS scope, gc.name AS title, COALESCE(gc.code, '') AS subtitle,
              NULL AS status, NULL AS priority, gc.code AS category, gc.created_at, gc.updated_at,
              CASE WHEN gc.name ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('code', gc.code) AS metadata
            FROM grievance_categories gc
            WHERE ${where} AND (gc.name ILIKE '%' || ${termMatch} || '%' OR gc.code ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'notifications':
          selects.push(`
            SELECT n.id, 'notifications' AS scope, n.title, n.body AS subtitle,
              n.type AS status, n.channel AS priority, NULL AS category, n.created_at, n.updated_at,
              CASE WHEN n.title ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('type', n.type, 'channel', n.channel) AS metadata
            FROM notifications n
            WHERE ${where} AND (n.title ILIKE '%' || ${termMatch} || '%' OR n.body ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'qr_codes':
          selects.push(`
            SELECT q.id, 'qr_codes' AS scope, q.name AS title, q.code AS subtitle,
              q.type AS status, NULL AS priority, NULL AS category, q.created_at, q.updated_at,
              CASE WHEN q.name ILIKE '%' || ${termMatch} || '%' THEN 3 WHEN q.code ILIKE '%' || ${termMatch} || '%' THEN 4 ELSE 1 END AS relevance,
              jsonb_build_object('code', q.code, 'type', q.type) AS metadata
            FROM qr_codes q
            WHERE ${where} AND (q.name ILIKE '%' || ${termMatch} || '%' OR q.code ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'templates':
          selects.push(`
            SELECT mt.id, 'templates' AS scope, mt.name AS title, COALESCE(mt.subject, '') AS subtitle,
              mt.type AS status, mt.channel AS priority, NULL AS category, mt.created_at, mt.updated_at,
              CASE WHEN mt.name ILIKE '%' || ${termMatch} || '%' THEN 3 ELSE 1 END AS relevance,
              jsonb_build_object('type', mt.type, 'channel', mt.channel) AS metadata
            FROM message_templates mt
            WHERE ${where} AND (mt.name ILIKE '%' || ${termMatch} || '%' OR mt.subject ILIKE '%' || ${termMatch} || '%' OR mt.body ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'assessment_templates':
          selects.push(`
            SELECT at.id, 'assessment_templates' AS scope, at.title AS title, COALESCE(at.description, '') AS subtitle,
              at.status, at.type AS priority, NULL AS category, at.created_at, at.updated_at,
              CASE WHEN at.title ILIKE '%' || ${termMatch} || '%' THEN 3
                   WHEN at.code ILIKE '%' || ${termMatch} || '%' THEN 4 ELSE 1 END AS relevance,
              jsonb_build_object('type', at.type, 'version', at.version, 'code', at.code) AS metadata
            FROM assessment_templates at
            WHERE ${where} AND at.is_archived = FALSE
              AND (at.title ILIKE '%' || ${termMatch} || '%' OR at.code ILIKE '%' || ${termMatch} || '%'
                   OR at.description ILIKE '%' || ${termMatch} || '%')`);
          break;
        case 'assessments':
          selects.push(`
            SELECT a.id, 'assessments' AS scope, a.title AS title, COALESCE(a.code, '') AS subtitle,
              a.status, a.type AS priority, NULL AS category, a.created_at, a.updated_at,
              CASE WHEN a.title ILIKE '%' || ${termMatch} || '%' THEN 3
                   WHEN a.code ILIKE '%' || ${termMatch} || '%' THEN 4 ELSE 1 END AS relevance,
              jsonb_build_object('type', a.type, 'progress', a.progress) AS metadata
            FROM assessments a
            WHERE ${where}
              AND (a.title ILIKE '%' || ${termMatch} || '%' OR a.code ILIKE '%' || ${termMatch} || '%')`);
          break;
      }
    }

    if (!selects.length) return { hits: [], total: 0 };

    const combined = selects.join(' UNION ALL ');
    const sortCol = SORT_COLUMN[sortField] ?? 'relevance';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const countResult = await query<{ total: string }>(`SELECT COUNT(*) AS total FROM (${combined}) sub`, baseParams);
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const dataSql = `SELECT * FROM (${combined}) sub ORDER BY ${sortCol} ${dir} LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`;
    const { rows } = await query<RawHit>(dataSql, [...baseParams, limit, offset]);

    const hits: SearchHit[] = rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      title: r.title,
      subtitle: r.subtitle,
      status: r.status,
      priority: r.priority,
      category: r.category,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at ? (r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)) : null,
      url: buildUrl(r.scope, r.id, r.metadata ?? {}),
      metadata: r.metadata ?? {},
    }));

    return { hits, total };
  },
};

export interface SavedSearchRecord {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  scope: string;
  query: string;
  filters: Record<string, unknown>;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentSearchRecord {
  id: string;
  organizationId: string;
  userId: string;
  scope: string;
  query: string;
  resultCount: number;
  lastRunAt: string;
  createdAt: string;
}

const mapSaved = (r: any): SavedSearchRecord => ({
  id: r.id,
  organizationId: r.organization_id,
  userId: r.user_id,
  name: r.name,
  scope: r.scope,
  query: r.query,
  filters: r.filters,
  isGlobal: r.is_global,
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
});

const mapRecent = (r: any): RecentSearchRecord => ({
  id: r.id,
  organizationId: r.organization_id,
  userId: r.user_id,
  scope: r.scope,
  query: r.query,
  resultCount: r.result_count,
  lastRunAt: r.last_run_at instanceof Date ? r.last_run_at.toISOString() : String(r.last_run_at),
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
});

export const savedSearchRepo = {
  async list(orgId: string, userId: string): Promise<SavedSearchRecord[]> {
    const { rows } = await query(
      `SELECT * FROM saved_searches WHERE organization_id = $1 AND (user_id = $2 OR is_global = TRUE) ORDER BY name ASC`,
      [orgId, userId],
    );
    return rows.map(mapSaved);
  },

  async get(orgId: string, userId: string, id: string): Promise<SavedSearchRecord | null> {
    const { rows } = await query(
      `SELECT * FROM saved_searches WHERE organization_id = $1 AND id = $2 AND (user_id = $3 OR is_global = TRUE)`,
      [orgId, id, userId],
    );
    return rows[0] ? mapSaved(rows[0]) : null;
  },

  async create(input: {
    organizationId: string;
    userId: string;
    name: string;
    scope: string;
    query: string;
    filters?: Record<string, unknown>;
    isGlobal?: boolean;
  }): Promise<SavedSearchRecord> {
    const { rows } = await query(
      `INSERT INTO saved_searches (organization_id, user_id, name, scope, query, filters, is_global)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [input.organizationId, input.userId, input.name, input.scope, input.query, JSON.stringify(input.filters ?? {}), input.isGlobal ?? false],
    );
    return mapSaved(rows[0]);
  },

  async update(
    orgId: string,
    userId: string,
    id: string,
    patch: Partial<{ name: string; scope: string; query: string; filters: Record<string, unknown>; isGlobal: boolean }>,
  ): Promise<SavedSearchRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.scope !== undefined) set('scope', patch.scope);
    if (patch.query !== undefined) set('query', patch.query);
    if (patch.filters !== undefined) set('filters', JSON.stringify(patch.filters));
    if (patch.isGlobal !== undefined) set('is_global', patch.isGlobal);
    if (!sets.length) return this.get(orgId, userId, id);
    set('updated_at', new Date());
    params.push(orgId, userId, id);
    const { rows } = await query(
      `UPDATE saved_searches SET ${sets.join(', ')} WHERE organization_id = $${i++} AND id = $${i++} AND user_id = $${i++} RETURNING *`,
      params,
    );
    return rows[0] ? mapSaved(rows[0]) : null;
  },

  async remove(orgId: string, userId: string, id: string): Promise<void> {
    await query(`DELETE FROM saved_searches WHERE organization_id = $1 AND id = $2 AND user_id = $3`, [orgId, userId, id]);
  },
};

export const recentSearchRepo = {
  async list(orgId: string, userId: string, limit = 10): Promise<RecentSearchRecord[]> {
    const { rows } = await query(
      `SELECT * FROM recent_searches WHERE organization_id = $1 AND user_id = $2 ORDER BY last_run_at DESC LIMIT $3`,
      [orgId, userId, limit],
    );
    return rows.map(mapRecent);
  },

  async record(orgId: string, userId: string, scope: string, term: string, resultCount: number): Promise<void> {
    const { rows } = await query(
      `SELECT id FROM recent_searches WHERE organization_id = $1 AND user_id = $2 AND scope = $3 AND query = $4 LIMIT 1`,
      [orgId, userId, scope, term],
    );
    if (rows[0]) {
      await query(`UPDATE recent_searches SET last_run_at = now(), result_count = $1 WHERE id = $2`, [resultCount, rows[0].id]);
      return;
    }
    await query(
      `INSERT INTO recent_searches (organization_id, user_id, scope, query, result_count) VALUES ($1, $2, $3, $4, $5)`,
      [orgId, userId, scope, term, resultCount],
    );
  },

  async clear(orgId: string, userId: string): Promise<void> {
    await query(`DELETE FROM recent_searches WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
  },
};
