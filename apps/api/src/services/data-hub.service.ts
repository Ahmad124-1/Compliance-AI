import { randomUUID } from 'node:crypto';

import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';

// =====================================================================
// PHASE 3: DATA HUB (SUSTAINABILITY WORKSPACE)
// Centralized single source of truth services.
// All services reuse existing tables (organizations, sites, departments,
// facilities, suppliers, sustainability_programs, esg_goals,
// sustainability_kpis, emission_factors, worker_documents, standards,
// frameworks) and add bridge/mapping/sync logic only.
// =====================================================================

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface DataHubDashboardSummary {
  organization: { id: string; name: string } | null;
  counts: {
    facilities: number;
    sites: number;
    departments: number;
    suppliers: number;
    programs: number;
    goals: number;
    kpis: number;
    documents: number;
    emissionFactors: number;
    standards: number;
    frameworks: number;
  };
  pendingValidation: number;
  activeImports: number;
  recentActivity: DataHubActivityEntry[];
}

export interface DataHubActivityEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface MasterDataCollection {
  facilities: Array<Record<string, unknown>>;
  sites: Array<Record<string, unknown>>;
  departments: Array<Record<string, unknown>>;
  suppliers: Array<Record<string, unknown>>;
  programs: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  kpis: Array<Record<string, unknown>>;
  reportingPeriods: Array<Record<string, unknown>>;
  emissionFactors: Array<Record<string, unknown>>;
  units: Array<Record<string, unknown>>;
  currencies: Array<Record<string, unknown>>;
  countries: Array<Record<string, unknown>>;
  standards: Array<Record<string, unknown>>;
  frameworks: Array<Record<string, unknown>>;
}

export interface ImportJob {
  id: string;
  organizationId: string;
  userId: string;
  importType: string;
  entityType: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  status: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errorSummary: unknown[];
  metadata: Record<string, unknown>;
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationQueueItem {
  id: string;
  importJobId: string | null;
  entityType: string;
  entityName: string | null;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'merged' | 'ignored';
  validationErrors: unknown[];
  validationWarnings: unknown[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  propagatedTo: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface HubDocument {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  linkCount: number;
}

export interface QueueStatusCounts {
  status: string;
  count: number;
}

export interface AIExtractionResult {
  entityType: string;
  extracted: Record<string, unknown>;
  confidence: number;
  warnings: string[];
}

// ---------------------------------------------------------------------
// ReferenceDataService — reusable master data from existing tables
// ---------------------------------------------------------------------

const MASTER_DATA_SOURCES: Record<
  string,
  { table: string; label: string; orgColumn: string; softDeleteColumn?: string; nameColumn: string }
> = {
  facilities: { table: 'facilities', label: 'Facilities', orgColumn: 'organization_id', softDeleteColumn: 'is_deleted', nameColumn: 'name' },
  sites: { table: 'sites', label: 'Sites', orgColumn: 'organization_id', nameColumn: 'name' },
  departments: { table: 'departments', label: 'Departments', orgColumn: 'organization_id', nameColumn: 'name' },
  suppliers: { table: 'suppliers', label: 'Suppliers', orgColumn: 'organization_id', nameColumn: 'name' },
  programs: { table: 'sustainability_programs', label: 'Programs', orgColumn: 'organization_id', nameColumn: 'name' },
  goals: { table: 'esg_goals', label: 'Goals', orgColumn: 'organization_id', nameColumn: 'name' },
  kpis: { table: 'sustainability_kpis', label: 'KPIs', orgColumn: 'organization_id', nameColumn: 'name' },
  emission_factors: { table: 'emission_factors', label: 'Emission Factors', orgColumn: 'organization_id', nameColumn: 'name' },
  standards: { table: 'standards', label: 'Standards', orgColumn: 'organization_id', nameColumn: 'name' },
};

export class ReferenceDataService {
  async getMasterData(orgId: string): Promise<MasterDataCollection> {
    const facilities = await this.listEntity(orgId, 'facilities');
    const sites = await this.listEntity(orgId, 'sites');
    const departments = await this.listEntity(orgId, 'departments');
    const suppliers = await this.listEntity(orgId, 'suppliers');
    const programs = await this.listEntity(orgId, 'programs');
    const goals = await this.listEntity(orgId, 'goals');
    const kpis = await this.listEntity(orgId, 'kpis');
    const emissionFactors = await this.listEntity(orgId, 'emission_factors');

    const standards = await this.listStandardsGlobal();

    return {
      facilities,
      sites,
      departments,
      suppliers,
      programs,
      goals,
      kpis,
      reportingPeriods: await this.listReportingPeriods(orgId),
      emissionFactors,
      units: await this.listUnits(),
      currencies: await this.listCurrencies(),
      countries: await this.listCountries(),
      standards,
      frameworks: await this.listFrameworksGlobal(),
    };
  }

  private async listEntity(orgId: string, key: string): Promise<Array<Record<string, unknown>>> {
    const source = MASTER_DATA_SOURCES[key];
    if (!source) return [];
    let sql = `SELECT * FROM ${source.table} WHERE ${source.orgColumn} = $1`;
    const params: unknown[] = [orgId];
    if (source.softDeleteColumn) {
      sql += ` AND ${source.softDeleteColumn} = FALSE`;
    }
    sql += ` ORDER BY ${source.nameColumn} ASC LIMIT 500`;
    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRow(row));
  }

  private async listReportingPeriods(orgId: string): Promise<Array<Record<string, unknown>>> {
    // Reuse esg_reporting_periods if present; fall back to distinct reporting_period values.
    try {
      const result = await query(
        `SELECT * FROM esg_reporting_periods WHERE organization_id = $1 ORDER BY start_date DESC NULLS LAST LIMIT 200`,
        [orgId],
      );
      if (result.rows.length > 0) {
        return result.rows.map((row) => this.mapRow(row));
      }
    } catch {
      // Table may not exist in older deployments — fall through to emission_records periods.
    }
    try {
      const result = await query(
        `SELECT DISTINCT reporting_period AS name, reporting_period AS label
           FROM emission_records
          WHERE organization_id = $1 AND reporting_period IS NOT NULL
          ORDER BY reporting_period DESC LIMIT 200`,
        [orgId],
      );
      return result.rows.map((row) => this.mapRow(row));
    } catch {
      return [];
    }
  }

  private async listUnits(): Promise<Array<Record<string, unknown>>> {
    try {
      const result = await query(
        `SELECT DISTINCT unit AS id, unit AS name, unit AS symbol FROM emission_records WHERE unit IS NOT NULL ORDER BY unit LIMIT 200`,
      );
      if (result.rows.length > 0) return result.rows.map((row) => this.mapRow(row));
    } catch {
      // fall through
    }
    return [
      { id: 'tCO2e', name: 'tCO2e', symbol: 'tCO2e' },
      { id: 'MWh', name: 'MWh', symbol: 'MWh' },
      { id: 'm3', name: 'Cubic meters', symbol: 'm3' },
      { id: 't', name: 'Tonnes', symbol: 't' },
      { id: 'kWh', name: 'Kilowatt-hours', symbol: 'kWh' },
    ];
  }

  private async listCurrencies(): Promise<Array<Record<string, unknown>>> {
    return [
      { id: 'USD', name: 'US Dollar', symbol: '$' },
      { id: 'EUR', name: 'Euro', symbol: '€' },
      { id: 'GBP', name: 'British Pound', symbol: '£' },
      { id: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
      { id: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { id: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
      { id: 'INR', name: 'Indian Rupee', symbol: '₹' },
    ];
  }

  private async listCountries(): Promise<Array<Record<string, unknown>>> {
    return [
      { id: 'US', name: 'United States' },
      { id: 'GB', name: 'United Kingdom' },
      { id: 'PK', name: 'Pakistan' },
      { id: 'AE', name: 'United Arab Emirates' },
      { id: 'SA', name: 'Saudi Arabia' },
      { id: 'DE', name: 'Germany' },
      { id: 'FR', name: 'France' },
      { id: 'IN', name: 'India' },
      { id: 'CN', name: 'China' },
      { id: 'SG', name: 'Singapore' },
    ];
  }

  /**
   * Standards live in a global catalogue (migration 0002) shared by all
   * organizations — list them without an org filter.
   */
  private async listStandardsGlobal(): Promise<Array<Record<string, unknown>>> {
    try {
      const result = await query(
        `SELECT * FROM standards WHERE is_active = TRUE ORDER BY name ASC LIMIT 500`,
      );
      if (result.rows.length > 0) return result.rows.map((row) => this.mapRow(row));
    } catch {
      // fall through to empty list
    }
    return [];
  }

  /**
   * Frameworks are versioned instances in the global catalogue (migration 0002);
   * joined against standards (their parent). No org filter applies.
   */
  private async listFrameworksGlobal(): Promise<Array<Record<string, unknown>>> {
    try {
      const result = await query(
        `SELECT f.id, f.standard_id, s.name AS name, s.code AS standard_code,
                s.publisher, f.version, f.title, f.description, f.status,
                f.published_at, f.is_active, f.created_at, f.updated_at, 'framework' AS kind
           FROM frameworks f
           JOIN standards s ON s.id = f.standard_id
          WHERE f.is_active = TRUE
          ORDER BY s.name ASC, f.version DESC
          LIMIT 500`,
      );
      if (result.rows.length > 0) return result.rows.map((row) => this.mapRow(row));
    } catch {
      // fall through to empty list
    }
    return [];
  }

  private mapRow(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      out[camel] = value;
    }
    return out;
  }
}

// ---------------------------------------------------------------------
// ActivityService — data hub activity timeline
// ---------------------------------------------------------------------

export class ActivityService {
  async log(orgId: string, userId: string | null, action: string, entity: { type?: string; id?: string; name?: string }, details: Record<string, unknown> = {}): Promise<void> {
    await query(
      `INSERT INTO data_hub_activity_log (id, organization_id, user_id, action, entity_type, entity_id, entity_name, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [randomUUID(), orgId, userId, action, entity.type ?? null, entity.id ?? null, entity.name ?? null, JSON.stringify(details)],
    );
  }

  async list(orgId: string, limit = 100): Promise<DataHubActivityEntry[]> {
    const result = await query(
      `SELECT id, action, entity_type, entity_id, entity_name, details, created_at
         FROM data_hub_activity_log
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [orgId, limit],
    );
    return result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      details: typeof row.details === 'object' ? row.details : {},
      createdAt: row.created_at,
    }));
  }
}

// ---------------------------------------------------------------------
// ImportService — upload, preview, commit workflow
// ---------------------------------------------------------------------

export class ImportService {
  async createImportJob(orgId: string, userId: string, input: {
    importType: string;
    entityType: string;
    fileName: string;
    fileUrl?: string;
    fileSize?: number;
    records?: Array<Record<string, unknown>>;
    metadata?: Record<string, unknown>;
  }): Promise<ImportJob> {
    const records = Array.isArray(input.records) ? input.records : [];
    const id = randomUUID();
    const result = await query(
      `INSERT INTO data_hub_import_jobs (
         id, organization_id, user_id, import_type, entity_type, file_name, file_url,
         file_size, status, total_records, valid_records, invalid_records, error_summary, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'uploaded', $9, 0, 0, '[]', $10)
       RETURNING *`,
      [
        id, orgId, userId, input.importType, input.entityType, input.fileName,
        input.fileUrl ?? null, input.fileSize ?? null, records.length,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    const job = this.mapImportJob(result.rows[0]);

    // Each record enters the validation queue.
    for (const record of records) {
      await query(
        `INSERT INTO data_hub_validation_queue (
           id, organization_id, import_job_id, entity_type, entity_name,
           raw_data, normalized_data, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          randomUUID(), orgId, id, input.entityType,
          String(record.name ?? record.title ?? record.code ?? 'Untitled'),
          JSON.stringify(record), JSON.stringify(record),
        ],
      );
    }

    if (records.length > 0) {
      const valid = await this.countJobValidation(id, 'pending');
      await query(
        `UPDATE data_hub_import_jobs SET valid_records = $1, updated_at = now() WHERE id = $2`,
        [valid, id],
      );
    }

    return job;
  }

  async preview(orgId: string, jobId: string): Promise<{ job: ImportJob; records: ValidationQueueItem[] }> {
    const jobResult = await query(
      `SELECT * FROM data_hub_import_jobs WHERE id = $1 AND organization_id = $2`,
      [jobId, orgId],
    );
    if (jobResult.rows.length === 0) throw new NotFoundError('Import job not found');
    const recordsResult = await query(
      `SELECT * FROM data_hub_validation_queue WHERE import_job_id = $1 ORDER BY created_at ASC LIMIT 500`,
      [jobId],
    );
    return {
      job: this.mapImportJob(jobResult.rows[0]),
      records: recordsResult.rows.map((row) => this.mapValidationItem(row)),
    };
  }

  async commitJob(orgId: string, userId: string, jobId: string, options: { entityType?: string } = {}): Promise<ImportJob> {
    // Only records that were approved/edited/merged are propagated.
    const propagated = await query(
      `SELECT * FROM data_hub_validation_queue
        WHERE import_job_id = $1 AND organization_id = $2 AND status IN ('approved','edited','merged')`,
      [jobId, orgId],
    );

    const entityType = options.entityType ?? (propagated.rows[0]?.entity_type as string | undefined) ?? 'unknown';
    const propagatedIds: string[] = [];

    for (const row of propagated.rows) {
      const targetId = await this.propagateRecord(orgId, userId, entityType, row.normalized_data);
      if (targetId) propagatedIds.push(targetId);
      await query(
        `UPDATE data_hub_validation_queue
            SET status = 'ignored', propagated_to = $1, updated_at = now()
          WHERE id = $2`,
        [JSON.stringify([targetId ?? null].filter(Boolean)), row.id],
      );
    }

    const totalResult = await query(`SELECT COUNT(*)::int AS count FROM data_hub_validation_queue WHERE import_job_id = $1`, [jobId]);
    const approvedCount = await query(
      `SELECT COUNT(*)::int AS count FROM data_hub_validation_queue
        WHERE import_job_id = $1 AND status IN ('approved','edited','merged','ignored')`,
      [jobId],
    );

    const result = await query(
      `UPDATE data_hub_import_jobs
          SET status = 'committed',
              valid_records = $2,
              invalid_records = GREATEST(($3::int) - ($2::int), 0),
              committed_at = now(),
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [jobId, approvedCount.rows[0].count, totalResult.rows[0].count],
    );
    if (result.rows.length === 0) throw new NotFoundError('Import job not found');

    await ActivityServiceInstance.log(orgId, userId, 'import.committed', {
      type: 'import_job',
      id: jobId,
      name: result.rows[0].file_name as string,
    }, { propagated: propagatedIds.length, entityType });

    return this.mapImportJob(result.rows[0]);
  }

  /**
   * Propagate an approved record into the target module table.
   * Reuses existing tables; inserts only when an equivalent record does not exist.
   */
  private async propagateRecord(orgId: string, userId: string, entityType: string, data: Record<string, unknown>): Promise<string | null> {
    const type = entityType.toLowerCase();
    const entityTable = MASTER_DATA_SOURCES[type];
    if (!entityTable) return null;
    // Standards/frameworks are global reference catalogues (no org_id column);
    // they cannot be propagated as org-scoped records — skip cleanly.
    if (type === 'standards' || type === 'frameworks') return null;

    const name = String(data.name ?? data.title ?? data.code ?? 'Imported');
    const existing = await query(
      `SELECT id FROM ${entityTable.table} WHERE organization_id = $1 AND ${entityTable.nameColumn} = $2 LIMIT 1`,
      [orgId, name],
    );
    if (existing.rows.length > 0) return existing.rows[0].id as string;

    const id = randomUUID();
    const code = data.code ?? data.code_name ?? null;
    const address = data.address ?? {};

    switch (type) {
      case 'facilities': {
        await query(
          `INSERT INTO facilities (id, organization_id, name, facility_type, address, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, orgId, name, String(data.facilityType ?? data.facility_type ?? 'plant'), JSON.stringify(address), data.latitude ?? null, data.longitude ?? null],
        );
        break;
      }
      case 'sites': {
        await query(
          `INSERT INTO sites (id, organization_id, name, code, address)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, orgId, name, code ? String(code) : null, JSON.stringify(address)],
        );
        break;
      }
      case 'departments': {
        await query(
          `INSERT INTO departments (id, organization_id, site_id, name, code)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, orgId, data.siteId ?? data.site_id ?? null, name, code ? String(code) : null],
        );
        break;
      }
      case 'suppliers': {
        await query(
          `INSERT INTO suppliers (id, organization_id, name, code)
           VALUES ($1, $2, $3, $4)`,
          [id, orgId, name, code ? String(code) : null],
        );
        break;
      }
      case 'programs': {
        await query(
          `INSERT INTO sustainability_programs (id, organization_id, name, description, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, orgId, name, data.description ?? null, String(data.category ?? 'general')],
        );
        break;
      }
      case 'goals': {
        await query(
          `INSERT INTO esg_goals (id, organization_id, name, description, esg_pillar, target_value)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, orgId, name, data.description ?? null, String(data.esgPillar ?? data.esg_pillar ?? 'environment'), data.targetValue ?? data.target_value ?? 0],
        );
        break;
      }
      case 'kpis': {
        const kpiType = String(data.kpiType ?? data.kpi_type ?? data.type ?? 'count');
        const validatedKpiType = ['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean'].includes(kpiType)
          ? kpiType
          : 'count';
        await query(
          `INSERT INTO sustainability_kpis (id, organization_id, name, description, unit, kpi_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, orgId, name, data.description ?? null, String(data.unit ?? 'count'), validatedKpiType],
        );
        break;
      }
      case 'emission_factors': {
        await query(
          `INSERT INTO emission_factors (id, organization_id, name, description, factor_type, category, value, unit, source, effective_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, orgId, name, data.description ?? null,
            String(data.factorType ?? data.factor_type ?? 'general'),
            String(data.category ?? 'general'),
            Number(data.value ?? 0),
            String(data.unit ?? 'kgCO2e/unit'),
            String(data.source ?? 'imported'),
            data.effectiveDate ?? data.effective_date ?? new Date().toISOString().slice(0, 10),
          ],
        );
        break;
      }
      default:
        return null;
    }

    await ActivityServiceInstance.log(orgId, userId, 'data.propagated', {
      type,
      id,
      name,
    });
    return id;
  }

  async listJobs(orgId: string, status?: string): Promise<ImportJob[]> {
    let sql = `SELECT * FROM data_hub_import_jobs WHERE organization_id = $1`;
    const params: unknown[] = [orgId];
    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC LIMIT 200`;
    const result = await query(sql, params);
    return result.rows.map((row) => this.mapImportJob(row));
  }

  async getQueueCounts(orgId: string): Promise<QueueStatusCounts[]> {
    const result = await query(
      `SELECT status, COUNT(*)::int AS count
         FROM data_hub_validation_queue
        WHERE organization_id = $1
        GROUP BY status
        ORDER BY status`,
      [orgId],
    );
    return result.rows.map((row) => ({ status: String(row.status), count: Number(row.count) }));
  }

  private async countJobValidation(jobId: string, status: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM data_hub_validation_queue WHERE import_job_id = $1 AND status = $2`,
      [jobId, status],
    );
    return Number(result.rows[0].count);
  }

  private mapImportJob(row: Record<string, unknown>): ImportJob {
    return {
      id: String(row.id),
      organizationId: String(row.organization_id),
      userId: String(row.user_id),
      importType: String(row.import_type),
      entityType: String(row.entity_type),
      fileName: String(row.file_name),
      fileUrl: row.file_url ? String(row.file_url) : null,
      fileSize: row.file_size ? Number(row.file_size) : null,
      status: String(row.status),
      totalRecords: Number(row.total_records ?? 0),
      validRecords: Number(row.valid_records ?? 0),
      invalidRecords: Number(row.invalid_records ?? 0),
      errorSummary: Array.isArray(row.error_summary) ? row.error_summary : [],
      metadata: typeof row.metadata === 'object' && row.metadata ? (row.metadata as Record<string, unknown>) : {},
      committedAt: row.committed_at ? String(row.committed_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapValidationItem(row: Record<string, unknown>): ValidationQueueItem {
    return {
      id: String(row.id),
      importJobId: row.import_job_id ? String(row.import_job_id) : null,
      entityType: String(row.entity_type),
      entityName: row.entity_name ? String(row.entity_name) : null,
      rawData: typeof row.raw_data === 'object' && row.raw_data ? (row.raw_data as Record<string, unknown>) : {},
      normalizedData: typeof row.normalized_data === 'object' && row.normalized_data ? (row.normalized_data as Record<string, unknown>) : {},
      status: String(row.status) as ValidationQueueItem['status'],
      validationErrors: Array.isArray(row.validation_errors) ? row.validation_errors : [],
      validationWarnings: Array.isArray(row.validation_warnings) ? row.validation_warnings : [],
      reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      reviewNote: row.review_note ? String(row.review_note) : null,
      propagatedTo: Array.isArray(row.propagated_to) ? row.propagated_to : [],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

// ---------------------------------------------------------------------
// ValidationService — approve / reject / edit / merge / ignore
// ---------------------------------------------------------------------

export class ValidationService {
  async list(orgId: string, status?: string, limit = 200): Promise<ValidationQueueItem[]> {
    let sql = `SELECT * FROM data_hub_validation_queue WHERE organization_id = $1`;
    const params: unknown[] = [orgId];
    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await query(sql, params);
    return result.rows.map((row) => ImportServiceInstance['mapValidationItem'](row));
  }

  async review(
    orgId: string,
    userId: string,
    id: string,
    action: 'approve' | 'reject' | 'edit' | 'merge' | 'ignore',
    input: { note?: string; data?: Record<string, unknown> },
  ): Promise<ValidationQueueItem> {
    const result = await query(
      `SELECT * FROM data_hub_validation_queue WHERE id = $1 AND organization_id = $2`,
      [id, orgId],
    );
    if (result.rows.length === 0) throw new NotFoundError('Validation record not found');
    const row = result.rows[0];

    let status: ValidationQueueItem['status'];
    switch (action) {
      case 'approve': status = 'approved'; break;
      case 'reject': status = 'rejected'; break;
      case 'edit': status = 'edited'; break;
      case 'merge': status = 'merged'; break;
      case 'ignore': status = 'ignored'; break;
    }

    const normalized = action === 'edit' && input.data ? JSON.stringify(input.data) : row.normalized_data;
    const errors = action === 'edit' && input.data
      ? JSON.stringify([])
      : row.validation_errors;

    const updated = await query(
      `UPDATE data_hub_validation_queue
          SET status = $1,
              normalized_data = $2,
              validation_errors = $3,
              reviewed_by = $4,
              reviewed_at = now(),
              review_note = COALESCE($5, review_note),
              updated_at = now()
        WHERE id = $6
        RETURNING *`,
      [status, normalized, errors, userId, input.note ?? null, id],
    );

    // If the rec belongs to an import job, refresh job counts.
    if (row.import_job_id) {
      await this.refreshJobCounts(String(row.import_job_id));
    }

    await ActivityServiceInstance.log(orgId, userId, `validation.${action}`, {
      type: 'validation_queue',
      id,
      name: row.entity_name ? String(row.entity_name) : undefined,
    }, { note: input.note ?? null });

    return ImportServiceInstance['mapValidationItem'](updated.rows[0]);
  }

  private async refreshJobCounts(jobId: string): Promise<void> {
    const total = await query(`SELECT COUNT(*)::int AS count FROM data_hub_validation_queue WHERE import_job_id = $1`, [jobId]);
    const processed = await query(
      `SELECT COUNT(*)::int AS count FROM data_hub_validation_queue
        WHERE import_job_id = $1 AND status IN ('rejected','ignored')`,
      [jobId],
    );
    const approved = await query(
      `SELECT COUNT(*)::int AS count FROM data_hub_validation_queue
        WHERE import_job_id = $1 AND status IN ('approved','edited','merged')`,
      [jobId],
    );
    await query(
      `UPDATE data_hub_import_jobs
          SET total_records = $1, valid_records = $2, invalid_records = $3, updated_at = now()
        WHERE id = $4`,
      [total.rows[0].count, approved.rows[0].count, processed.rows[0].count, jobId],
    );
  }
}

// ---------------------------------------------------------------------
// DocumentService — reusable document repository (worker_documents + links)
// ---------------------------------------------------------------------

export class DocumentService {
  async list(orgId: string, category?: string): Promise<HubDocument[]> {
    let sql = `
      SELECT d.*,
        (SELECT COUNT(*)::int FROM data_hub_document_links dl WHERE dl.document_id = d.id) AS link_count
        FROM worker_documents d
       WHERE d.organization_id = $1`;
    const params: unknown[] = [orgId];
    if (category) {
      sql += ` AND d.category = $2`;
      params.push(category);
    }
    sql += ` ORDER BY d.created_at DESC LIMIT 300`;
    const result = await query(sql, params);
    return result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      category: String(row.category),
      fileUrl: String(row.file_url),
      fileName: row.file_name ? String(row.file_name) : null,
      fileType: row.file_type ? String(row.file_type) : null,
      fileSize: row.file_size ? Number(row.file_size) : null,
      metadata: typeof row.metadata === 'object' && row.metadata ? (row.metadata as Record<string, unknown>) : {},
      createdAt: String(row.created_at),
      linkCount: Number(row.link_count ?? 0),
    }));
  }

  async create(orgId: string, userId: string, input: {
    title: string;
    category: string;
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    metadata?: Record<string, unknown>;
    linkTo?: { entityType?: string; entityId?: string; linkType?: string }[];
  }): Promise<HubDocument> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO worker_documents (id, organization_id, user_id, title, category, file_url, file_name, file_type, file_size, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, orgId, userId, input.title, input.category, input.fileUrl,
        input.fileName ?? null, input.fileType ?? null, input.fileSize ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    const row = result.rows[0];

    // Link the document to referenced entities so all modules can reuse it.
    if (Array.isArray(input.linkTo)) {
      for (const link of input.linkTo) {
        if (!link.entityType) continue;
        await query(
          `INSERT INTO data_hub_document_links (id, organization_id, document_id, entity_type, entity_id, link_type, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [randomUUID(), orgId, id, link.entityType, link.entityId ?? null, link.linkType ?? 'reference', userId],
        );
      }
    }

    await ActivityServiceInstance.log(orgId, userId, 'document.uploaded', {
      type: 'document',
      id,
      name: input.title,
    }, { category: input.category });

    return {
      id: String(row.id),
      title: String(row.title),
      category: String(row.category),
      fileUrl: String(row.file_url),
      fileName: row.file_name ? String(row.file_name) : null,
      fileType: row.file_type ? String(row.file_type) : null,
      fileSize: row.file_size ? Number(row.file_size) : null,
      metadata: typeof row.metadata === 'object' && row.metadata ? (row.metadata as Record<string, unknown>) : {},
      createdAt: String(row.created_at),
      linkCount: Array.isArray(input.linkTo) ? input.linkTo.filter((l) => l.entityType).length : 0,
    };
  }

  async getLinkedDocuments(orgId: string, entityType: string, entityId: string): Promise<HubDocument[]> {
    const result = await query(
      `SELECT d.*, dl.link_type,
         (SELECT COUNT(*)::int FROM data_hub_document_links dl2 WHERE dl2.document_id = d.id) AS link_count
         FROM data_hub_document_links dl
         JOIN worker_documents d ON d.id = dl.document_id
        WHERE dl.organization_id = $1 AND dl.entity_type = $2 AND dl.entity_id = $3
        ORDER BY d.created_at DESC`,
      [orgId, entityType, entityId],
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      category: String(row.category),
      fileUrl: String(row.file_url),
      fileName: row.file_name ? String(row.file_name) : null,
      fileType: row.file_type ? String(row.file_type) : null,
      fileSize: row.file_size ? Number(row.file_size) : null,
      metadata: typeof row.metadata === 'object' && row.metadata ? (row.metadata as Record<string, unknown>) : {},
      createdAt: String(row.created_at),
      linkCount: Number(row.link_count ?? 0),
    }));
  }
}

// ---------------------------------------------------------------------
// DataHubService — dashboard aggregation
// ---------------------------------------------------------------------

export class DataHubService {
  async getDashboard(orgId: string): Promise<DataHubDashboardSummary> {
    const orgResult = await query(`SELECT id, name FROM organizations WHERE id = $1`, [orgId]);

    const count = async (table: string, orgColumn = 'organization_id', softDelete = false): Promise<number> => {
      try {
        let sql = `SELECT COUNT(*)::int AS count FROM ${table} WHERE ${orgColumn} = $1`;
        if (softDelete) sql += ` AND is_deleted = FALSE`;
        const result = await query(sql, [orgId]);
        return Number(result.rows[0].count ?? 0);
      } catch {
        return 0;
      }
    };

    const pendingValidation = await this.countWhere(
      `SELECT COUNT(*)::int AS count FROM data_hub_validation_queue WHERE organization_id = $1 AND status = 'pending'`,
      orgId,
    );
    const activeImports = await this.countWhere(
      `SELECT COUNT(*)::int AS count FROM data_hub_import_jobs WHERE organization_id = $1 AND status NOT IN ('committed','failed','cancelled')`,
      orgId,
    );

    const activity = await ActivityServiceInstance.list(orgId, 15);

    return {
      organization: orgResult.rows[0]
        ? { id: String(orgResult.rows[0].id), name: String(orgResult.rows[0].name) }
        : null,
      counts: {
        facilities: await count('facilities', 'organization_id', true),
        sites: await count('sites'),
        departments: await count('departments'),
        suppliers: await count('suppliers'),
        programs: await count('sustainability_programs'),
        goals: await count('esg_goals'),
        kpis: await count('sustainability_kpis'),
        documents: await count('worker_documents'),
        emissionFactors: await count('emission_factors'),
        standards: await this.countReference('standards'),
        frameworks: await this.countReference('frameworks'),
      },
      pendingValidation,
      activeImports,
      recentActivity: activity,
    };
  }

  /**
   * Standards and frameworks are global catalogues without organization_id;
   * count all rows (excluding soft-deleted where the column exists).
   */
  private async countReference(table: string): Promise<number> {
    try {
      const result = await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE is_active = TRUE`);
      return Number(result.rows[0].count ?? 0);
    } catch {
      return 0;
    }
  }

  private async countWhere(sql: string, orgId: string): Promise<number> {
    try {
      const result = await query(sql, [orgId]);
      return Number(result.rows[0].count ?? 0);
    } catch {
      return 0;
    }
  }

  async getStatistics(orgId: string): Promise<Record<string, unknown>> {
    const dashboard = await this.getDashboard(orgId);
    const queueCounts = await ImportServiceInstance.getQueueCounts(orgId);
    const importJobs = await ImportServiceInstance.listJobs(orgId);

    return {
      counts: dashboard.counts,
      queueCounts,
      importJobs: importJobs.map((j) => ({
        id: j.id,
        importType: j.importType,
        entityType: j.entityType,
        fileName: j.fileName,
        status: j.status,
        totalRecords: j.totalRecords,
        validRecords: j.validRecords,
        invalidRecords: j.invalidRecords,
        createdAt: j.createdAt,
        committedAt: j.committedAt,
      })),
      pendingValidation: dashboard.pendingValidation,
      activeImports: dashboard.activeImports,
    };
  }

  async getQueue(orgId: string): Promise<{ pending: ValidationQueueItem[]; processing: ValidationQueueItem[]; counts: QueueStatusCounts[] }> {
    const pending = await ValidationServiceInstance.list(orgId, 'pending', 100);
    const processing = await ValidationServiceInstance.list(orgId, 'approved', 100);
    const counts = await ImportServiceInstance.getQueueCounts(orgId);
    return { pending, processing, counts };
  }
}

// ---------------------------------------------------------------------
// PropagationService — automatically synchronize approved data into
// Compliance, Supplier, Sustainability, Carbon & GHG, ESG, Dashboards,
// Analytics and Reports.
//
// This implementation writes synchronization metadata (data_hub_activity_log)
// and reuses existing service layer tables. Reporting aggregation is
// prepared via ReportAggregationService but report generation itself is
// intentionally not implemented (per Phase 3 scope).
// ---------------------------------------------------------------------

export class PropagationService {
  async synchronize(orgId: string, userId: string, entityType: string, entityId: string, entityName: string): Promise<{ targets: string[] }> {
    const targets: string[] = [];
    const type = entityType.toLowerCase();

    // Every entity is registered in the shared activity timeline so
    // dashboards/analytics/reports already consume it without duplication.
    const available = [
      'facilities', 'sites', 'departments', 'suppliers', 'programs',
      'goals', 'kpis', 'reporting_periods', 'emission_factors',
      'documents', 'standards', 'frameworks',
    ];

    if (available.includes(type)) {
      targets.push('data_hub.activity_timeline');
    }
    if (['facilities', 'departments', 'suppliers', 'programs', 'goals', 'kpis'].includes(type)) {
      targets.push('sustainability');
    }
    if (['facilities', 'emission_factors', 'kpis', 'reporting_periods'].includes(type)) {
      targets.push('carbon_ghg');
    }
    if (['facilities', 'sites', 'departments', 'suppliers', 'programs', 'goals', 'kpis'].includes(type)) {
      targets.push('esg');
    }
    if (['suppliers', 'facilities', 'departments'].includes(type)) {
      targets.push('supplier');
    }
    if (['standards', 'sites', 'departments', 'facilities', 'documents'].includes(type)) {
      targets.push('compliance');
    }
    if (targets.length > 0) {
      targets.push('dashboards');
      targets.push('analytics');
      targets.push('reports');
    }

    await ActivityServiceInstance.log(orgId, userId, `propagation.synchronized`, {
      type,
      id: entityId,
      name: entityName,
    }, { targets });

    return { targets };
  }
}

// ---------------------------------------------------------------------
// ReportAggregationService — reusable infrastructure for reporting.
// Report generation is NOT implemented in Phase 3 (extension point only).
// ---------------------------------------------------------------------

export class ReportAggregationService {
  async getAvailableDimensions(orgId: string): Promise<Record<string, unknown>> {
    const dashboard = await DataHubServiceInstance.getDashboard(orgId);
    return {
      dimensions: [
        { key: 'facility', label: 'Facility', available: dashboard.counts.facilities > 0 },
        { key: 'site', label: 'Site', available: dashboard.counts.sites > 0 },
        { key: 'department', label: 'Department', available: dashboard.counts.departments > 0 },
        { key: 'supplier', label: 'Supplier', available: dashboard.counts.suppliers > 0 },
        { key: 'program', label: 'Program', available: dashboard.counts.programs > 0 },
        { key: 'goal', label: 'Goal', available: dashboard.counts.goals > 0 },
        { key: 'kpi', label: 'KPI', available: dashboard.counts.kpis > 0 },
      ],
      dataSources: [
        { key: 'data_hub', label: 'Data Hub (master data)', ready: true },
        { key: 'sustainability', label: 'Sustainability', ready: true },
        { key: 'carbon_ghg', label: 'Carbon & GHG', ready: true },
        { key: 'esg', label: 'ESG', ready: true },
        { key: 'compliance', label: 'Compliance', ready: true },
        { key: 'supplier', label: 'Supplier', ready: true },
      ],
    };
  }
}

// ---------------------------------------------------------------------
// AIExtractionService — interface ONLY.
// No OCR. No LLM. Extension points prepared for future AI integration.
// ---------------------------------------------------------------------

export interface AIExtractionProvider {
  readonly name: string;
  readonly supportedTypes: string[];
  canHandle(input: { fileType?: string | null; entityType: string }): boolean;
  extract(input: { fileUrl: string; fileName: string; entityType: string; metadata?: Record<string, unknown> }): Promise<AIExtractionResult>;
}

export class AIExtractionService {
  private providers: AIExtractionProvider[] = [];

  registerProvider(provider: AIExtractionProvider): void {
    this.providers.push(provider);
    console.log(`[data-hub] registered AI extraction provider: ${provider.name}`);
  }

  async extract(input: {
    fileUrl: string;
    fileName: string;
    entityType: string;
    fileType?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<AIExtractionResult> {
    const provider = this.providers.find((p) =>
      p.supportedTypes.includes(input.entityType) &&
      p.canHandle({ fileType: input.fileType ?? null, entityType: input.entityType }),
    );
    if (!provider) {
      // Clean extension point: no OCR/LLM implemented yet.
      return {
        entityType: input.entityType,
        extracted: {},
        confidence: 0,
        warnings: ['No AI extraction provider registered for this entity type yet.'],
      };
    }
    return provider.extract(input);
  }

  async getCapabilities(): Promise<Array<{ name: string; supportedTypes: string[] }>> {
    return this.providers.map((p) => ({ name: p.name, supportedTypes: p.supportedTypes }));
  }
}

// ---------------------------------------------------------------------
// Shared instances
// ---------------------------------------------------------------------

export const ReferenceDataServiceInstance = new ReferenceDataService();
export const ActivityServiceInstance = new ActivityService();
export const ImportServiceInstance = new ImportService();
export const ValidationServiceInstance = new ValidationService();
export const DocumentServiceInstance = new DocumentService();
export const DataHubServiceInstance = new DataHubService();
export const PropagationServiceInstance = new PropagationService();
export const ReportAggregationServiceInstance = new ReportAggregationService();
export const AIExtractionServiceInstance = new AIExtractionService();