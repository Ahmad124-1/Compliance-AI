import { randomUUID } from 'node:crypto';

import { query } from '../db/pool.js';
import { NotFoundError } from '../core/errors.js';

// =====================================================================
// PHASE 4 — SPRINT 4.1: MASTER DATA SYNCHRONIZATION
// Centralized services so every module reads the exact same records.
// Reuses all existing tables. Zero schema changes beyond migration 0030.
// =====================================================================

export type MasterEntityType =
  | 'facility' | 'site' | 'department' | 'supplier' | 'program' | 'goal'
  | 'kpi' | 'project' | 'reporting_period' | 'emission_factor' | 'document' | 'user';

interface EntitySource {
  table: string;
  label: string;
  orgColumn: string;
  nameColumn: string;
  softDeleteColumn?: string;
  readOnly?: boolean;
}

const CATALOG: Record<string, EntitySource> = {
  facility: { table: 'facilities', label: 'Facilities', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  site: { table: 'sites', label: 'Sites', orgColumn: 'organization_id', nameColumn: 'name' },
  department: { table: 'departments', label: 'Departments', orgColumn: 'organization_id', nameColumn: 'name' },
  supplier: { table: 'suppliers', label: 'Suppliers', orgColumn: 'organization_id', nameColumn: 'name' },
  program: { table: 'sustainability_programs', label: 'Programs', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  goal: { table: 'esg_goals', label: 'Goals', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  kpi: { table: 'sustainability_kpis', label: 'KPIs', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  project: { table: 'carbon_projects', label: 'Projects', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  reporting_period: { table: 'esg_reporting_periods', label: 'Reporting Periods', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  emission_factor: { table: 'emission_factors', label: 'Emission Factors', orgColumn: 'organization_id', nameColumn: 'name', softDeleteColumn: 'is_deleted' },
  document: { table: 'documents', label: 'Documents', orgColumn: 'organization_id', nameColumn: 'filename' },
  user: { table: 'users', label: 'Users', orgColumn: 'organization_id', nameColumn: 'name', readOnly: true },
};

export const MASTER_ENTITY_TYPES = Object.keys(CATALOG);

export interface SyncStatusEntry {
  entityType: string;
  entityLabel: string;
  lastSyncedAt: string | null;
  totalRecords: number;
  syncMode: string;
  syncedBy: string | null;
}

function pick(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return undefined;
}

function str(data: Record<string, unknown>, fallback: string, ...keys: string[]): string {
  const v = pick(data, ...keys);
  return v === undefined ? fallback : String(v);
}

function num(data: Record<string, unknown>, fallback: number, ...keys: string[]): number {
  const v = pick(data, ...keys);
  return v === undefined ? fallback : Number(v);
}

// Parent (foreign-key) columns per entity so duplicate detection and orphan
// checks are scoped correctly without duplicating lookup logic.
function parentRef(entityType: string, data: Record<string, unknown>): { column: string | null; value: unknown } {
  switch (entityType) {
    case 'department': return { column: 'site_id', value: pick(data, 'siteId', 'site_id') };
    case 'program': return { column: 'department_id', value: pick(data, 'departmentId', 'department_id') };
    case 'goal': return { column: 'program_id', value: pick(data, 'programId', 'program_id') };
    case 'kpi': return { column: 'program_id', value: pick(data, 'programId', 'program_id') };
    case 'project': return { column: 'facility_id', value: pick(data, 'facilityId', 'facility_id') };
    default: return { column: null, value: null };
  }
}

async function assertParent(orgId: string, table: string, column: string, value: unknown): Promise<void> {
  if (value === undefined || value === null || value === '') return;
  const res = await query(
    `SELECT id FROM ${table} WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
    [String(value), orgId],
  );
  if (res.rows.length === 0) {
    throw new NotFoundError(`${column} ${String(value)} not found in this organization`);
  }
}

async function findExisting(source: EntitySource, orgId: string, name: string, parentColumn: string | null, parentId: string | null): Promise<string | null> {
  let sql = `SELECT id FROM ${source.table} WHERE ${source.orgColumn} = $1 AND ${source.nameColumn} = $2`;
  const params: unknown[] = [orgId, name];
  if (source.softDeleteColumn) sql += ` AND ${source.softDeleteColumn} = FALSE`;
  if (parentColumn && parentId) {
    sql += ` AND ${parentColumn} = $3`;
    params.push(parentId);
  }
  sql += ' LIMIT 1';
  const res = await query(sql, params);
  return res.rows.length > 0 ? (res.rows[0].id as string) : null;
}

async function trackSync(orgId: string, userId: string | null, entityType: string): Promise<void> {
  await query(
    `INSERT INTO data_hub_sync_status (organization_id, entity_type, last_synced_at, last_synced_by, total_records, sync_mode)
     VALUES ($1, $2, now(), $3, 1, 'api')
     ON CONFLICT (organization_id, entity_type)
     DO UPDATE SET last_synced_at = now(), last_synced_by = EXCLUDED.last_synced_by,
                   total_records = data_hub_sync_status.total_records + 1, sync_mode = 'api', updated_at = now()`,
    [orgId, entityType, userId],
  );
}

// ---------------------------------------------------------------------
// Per-entity insert builders (data-driven, no duplicated switch logic)
// ---------------------------------------------------------------------

async function insertRecord(entityType: string, orgId: string, data: Record<string, unknown>): Promise<string> {
  const id = randomUUID();
  const name = str(data, 'Untitled', 'name', 'title', 'filename', 'code');
  const today = new Date().toISOString().slice(0, 10);

  switch (entityType) {
    case 'facility':
      await query(
        `INSERT INTO facilities (id, organization_id, name, facility_type, address, latitude, longitude, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, orgId, name, str(data, 'plant', 'facilityType', 'facility_type'),
          JSON.stringify(pick(data, 'address') ?? {}),
          pick(data, 'latitude', 'lat') ?? null, pick(data, 'longitude', 'lng', 'lon') ?? null,
          pick(data, 'isActive', 'is_active') ?? true],
      );
      break;
    case 'site': {
      const code = pick(data, 'code', 'code_name');
      await query(
        `INSERT INTO sites (id, organization_id, name, code, address) VALUES ($1,$2,$3,$4,$5)`,
        [id, orgId, name, code ? String(code) : null, JSON.stringify(pick(data, 'address') ?? {})],
      );
      break;
    }
    case 'department': {
      const siteId = pick(data, 'siteId', 'site_id');
      await assertParent(orgId, 'sites', 'site_id', siteId);
      const code = pick(data, 'code', 'code_name');
      await query(
        `INSERT INTO departments (id, organization_id, site_id, name, code) VALUES ($1,$2,$3,$4,$5)`,
        [id, orgId, siteId ? String(siteId) : null, name, code ? String(code) : null],
      );
      break;
    }
    case 'supplier': {
      const code = pick(data, 'code', 'supplierCode', 'supplier_code');
      await query(
        `INSERT INTO suppliers (id, organization_id, name, code) VALUES ($1,$2,$3,$4)`,
        [id, orgId, name, code ? String(code) : null],
      );
      break;
    }
    case 'program': {
      const deptId = pick(data, 'departmentId', 'department_id');
      await assertParent(orgId, 'departments', 'department_id', deptId);
      await query(
        `INSERT INTO sustainability_programs (id, organization_id, name, description, category, department_id, status, priority)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, orgId, name, pick(data, 'description') ?? null, str(data, 'general', 'category'),
          deptId ? String(deptId) : null, str(data, 'draft', 'status'), str(data, 'medium', 'priority')],
      );
      break;
    }
    case 'goal': {
      const programId = pick(data, 'programId', 'program_id');
      await assertParent(orgId, 'sustainability_programs', 'program_id', programId);
      await query(
        `INSERT INTO esg_goals (id, organization_id, name, description, program_id, esg_pillar, target_value, unit, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, orgId, name, pick(data, 'description') ?? null,
          programId ? String(programId) : null, str(data, 'environment', 'esgPillar', 'esg_pillar'),
          num(data, 0, 'targetValue', 'target_value'), str(data, '%', 'unit'), str(data, 'not_started', 'status')],
      );
      break;
    }
    case 'kpi': {
      const programId = pick(data, 'programId', 'program_id');
      const goalId = pick(data, 'goalId', 'goal_id');
      await assertParent(orgId, 'sustainability_programs', 'program_id', programId);
      await assertParent(orgId, 'esg_goals', 'goal_id', goalId);
      const kpiType = str(data, 'count', 'kpiType', 'kpi_type', 'type');
      const valid = ['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean'].includes(kpiType) ? kpiType : 'count';
      await query(
        `INSERT INTO sustainability_kpis (id, organization_id, name, description, program_id, goal_id, unit, kpi_type, frequency, aggregation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, orgId, name, pick(data, 'description') ?? null,
          programId ? String(programId) : null, goalId ? String(goalId) : null,
          str(data, 'count', 'unit'), valid, str(data, 'monthly', 'frequency'), str(data, 'latest', 'aggregation')],
      );
      break;
    }
    case 'project': {
      const facilityId = pick(data, 'facilityId', 'facility_id');
      await assertParent(orgId, 'facilities', 'facility_id', facilityId);
      await query(
        `INSERT INTO carbon_projects (id, organization_id, name, description, facility_id, project_type, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, orgId, name, pick(data, 'description') ?? null,
          facilityId ? String(facilityId) : null, str(data, 'other', 'projectType', 'project_type'), str(data, 'planning', 'status')],
      );
      break;
    }
    case 'reporting_period':
      await query(
        `INSERT INTO esg_reporting_periods (id, organization_id, name, period_type, start_date, end_date, due_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, orgId, name, str(data, 'custom', 'periodType', 'period_type'),
          str(data, today, 'startDate', 'start_date'), str(data, today, 'endDate', 'end_date'),
          str(data, today, 'dueDate', 'due_date', 'endDate', 'end_date'), str(data, 'upcoming', 'status')],
      );
      break;
    case 'emission_factor':
      await query(
        `INSERT INTO emission_factors (id, organization_id, name, description, factor_type, category, value, unit, source, effective_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, orgId, name, pick(data, 'description') ?? null, str(data, 'general', 'factorType', 'factor_type'),
          str(data, 'general', 'category'), num(data, 0, 'value'), str(data, 'kgCO2e', 'unit'),
          str(data, 'manual', 'source'), str(data, today, 'effectiveDate', 'effective_date')],
      );
      break;
    case 'document':
      await query(
        `INSERT INTO documents (id, organization_id, filename, content_type, size_bytes, metadata, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, orgId, str(data, 'Untitled', 'filename', 'title'),
          str(data, 'application/octet-stream', 'contentType', 'content_type'),
          num(data, 0, 'sizeBytes', 'size_bytes'), JSON.stringify(pick(data, 'metadata') ?? {}),
          str(data, 'ready', 'status')],
      );
      break;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  return id;
}

// ---------------------------------------------------------------------
// MasterDataSyncService
// ---------------------------------------------------------------------

export class MasterDataSyncService {
  async getMasterData(orgId: string): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};
    for (const entityType of MASTER_ENTITY_TYPES) {
      const source = CATALOG[entityType];
      let sql = `SELECT * FROM ${source.table} WHERE ${source.orgColumn} = $1`;
      const params: unknown[] = [orgId];
      if (source.softDeleteColumn) sql += ` AND ${source.softDeleteColumn} = FALSE`;
      sql += ` ORDER BY ${source.nameColumn} ASC LIMIT 2000`;
      const key = entityType === 'reporting_period' ? 'reportingPeriods' : `${entityType}s`;
      try {
        const res = await query(sql, params);
        result[key] = res.rows;
      } catch {
        result[key] = [];
      }
    }
    return result;
  }

  async getSyncStatus(orgId: string): Promise<SyncStatusEntry[]> {
    const res = await query(
      `SELECT s.entity_type, s.last_synced_at, s.total_records, s.sync_mode, u.name AS synced_by
         FROM data_hub_sync_status s
         LEFT JOIN users u ON u.id = s.last_synced_by
        WHERE s.organization_id = $1
        ORDER BY s.entity_type ASC`,
      [orgId],
    );
    return res.rows.map((row) => ({
      entityType: row.entity_type as string,
      entityLabel: CATALOG[row.entity_type as string]?.label ?? (row.entity_type as string),
      lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at as string).toISOString() : null,
      totalRecords: Number(row.total_records ?? 0),
      syncMode: row.sync_mode as string,
      syncedBy: (row.synced_by as string | null) ?? null,
    }));
  }

  async upsertEntity(orgId: string, userId: string, entityType: MasterEntityType, data: Record<string, unknown>): Promise<{ id: string; inserted: boolean; duplicate: boolean }> {
    const source = CATALOG[entityType];
    if (!source) throw new NotFoundError(`Unsupported master entity type: ${entityType}`);
    if (source.readOnly) throw new Error(`Entity type "${entityType}" is read-only`);

    const name = String(pick(data, 'name', 'title', 'filename', 'code') ?? 'Untitled');
    if (!name.trim()) throw new Error(`[${entityType}] Missing required field "name"`);

    // Parent-scoped duplicate detection so the same name under a different
    // parent is a new record, while the same name under the same parent is a
    // duplicate (prevents conflicting updates and duplicate records).
    const parent = parentRef(entityType, data);
    const existing = await findExisting(source, orgId, name, parent.column, parent.value ? String(parent.value) : null);
    if (existing) return { id: existing, inserted: false, duplicate: true };

    const id = await insertRecord(entityType, orgId, data);
    await trackSync(orgId, userId ?? null, entityType);
    return { id, inserted: true, duplicate: false };
  }
}

export const masterDataSyncService = new MasterDataSyncService();

// ---------------------------------------------------------------------
// MasterDataLookupService — reusable dropdown lookups for all forms.
// ---------------------------------------------------------------------

export class MasterDataLookupService {
  async lookup(orgId: string, entityType: MasterEntityType): Promise<Array<{ value: string; label: string }>> {
    const source = CATALOG[entityType];
    if (!source) return [];
    let sql = `SELECT id, ${source.nameColumn} AS label FROM ${source.table} WHERE ${source.orgColumn} = $1`;
    const params: unknown[] = [orgId];
    if (source.softDeleteColumn) sql += ` AND ${source.softDeleteColumn} = FALSE`;
    sql += ` ORDER BY ${source.nameColumn} ASC LIMIT 2000`;
    const res = await query(sql, params);
    return res.rows.map((row) => ({ value: row.id as string, label: (row.label as string) ?? String(row.id) }));
  }

  facilityLookup(orgId: string) { return this.lookup(orgId, 'facility'); }
  siteLookup(orgId: string) { return this.lookup(orgId, 'site'); }
  departmentLookup(orgId: string) { return this.lookup(orgId, 'department'); }
  supplierLookup(orgId: string) { return this.lookup(orgId, 'supplier'); }
  programLookup(orgId: string) { return this.lookup(orgId, 'program'); }
  goalLookup(orgId: string) { return this.lookup(orgId, 'goal'); }
  kpiLookup(orgId: string) { return this.lookup(orgId, 'kpi'); }
  projectLookup(orgId: string) { return this.lookup(orgId, 'project'); }
  reportingPeriodLookup(orgId: string) { return this.lookup(orgId, 'reporting_period'); }
  emissionFactorLookup(orgId: string) { return this.lookup(orgId, 'emission_factor'); }
  documentLookup(orgId: string) { return this.lookup(orgId, 'document'); }
  userLookup(orgId: string) { return this.lookup(orgId, 'user'); }
}

export const masterDataLookupService = new MasterDataLookupService();