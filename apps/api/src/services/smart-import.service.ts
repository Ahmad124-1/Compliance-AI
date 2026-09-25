import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { query } from '../db/pool.js';
import { ActivityServiceInstance } from './data-hub.service.js';
import { syncEngineService, type SyncEntityType } from './sync-engine.service.js';

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = new Set([
  'text/csv', 'application/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json', 'application/xml', 'text/xml',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
]);
const ALLOWED_EXTENSIONS = new Set(['csv', 'xlsx', 'json', 'xml', 'pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp']);

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
export type ImportStage = 'upload' | 'parse' | 'map' | 'validate' | 'duplicates' | 'commit' | 'sync' | 'complete';
export type ImportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'uploaded' | 'committed';
export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean' | 'percentage' | 'currency' | 'uuid' | 'email';
export type DuplicateAction = 'skip' | 'replace' | 'merge' | 'create_new';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  isAutoMapped: boolean;
  isRequired: boolean;
  dataType: ColumnDataType;
  sampleValues: unknown[];
}

export interface ImportColumn {
  id: string;
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  isAutoMapped: boolean;
  isRequired: boolean;
  dataType: ColumnDataType;
  sampleValues: unknown[];
}

export interface ValidationIssue {
  field: string;
  row: number;
  reason: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
  value?: unknown;
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface DuplicateMatch {
  id: string;
  duplicateKey: string;
  duplicateType: string;
  confidence: number;
  action: DuplicateAction;
  resolved: boolean;
  validationQueueId: string;
  duplicateOfValidationQueueId: string | null;
}

export interface ImportProgress {
  id: string;
  importJobId: string;
  stage: ImportStage;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  processed: number;
  message: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DocumentClassification {
  id: string;
  documentId: string;
  classification: string;
  confidence: number;
  method: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------
// Entity field definitions for smart column mapping + validation
// ---------------------------------------------------------------------
export interface EntityFieldDef {
  field: string;
  label: string;
  aliases: string[];
  dataType: ColumnDataType;
  required: boolean;
  enumValues?: string[];
  references?: { table: string; nameColumn: string; orgColumn: string };
  description?: string;
}

export interface EntityImportDef {
  entityType: string;
  table: string;
  nameColumn: string;
  fields: EntityFieldDef[];
}

export const IMPORT_ENTITY_DEFS: Record<string, EntityImportDef> = {
  facilities: {
    entityType: 'facilities', table: 'facilities', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Facility Name', aliases: ['facility', 'facility name', 'plant', 'factory', 'site', 'name', 'facility_name'], dataType: 'string', required: true },
      { field: 'facilityType', label: 'Facility Type', aliases: ['facility type', 'facility_type', 'type', 'category'], dataType: 'string', required: false, enumValues: ['plant', 'office', 'warehouse', 'store', 'factory', 'lab', 'data_center', 'other'] },
      { field: 'code', label: 'Code', aliases: ['code', 'facility code', 'facility_code', 'reference', 'ref'], dataType: 'string', required: false },
      { field: 'address', label: 'Address', aliases: ['address', 'location', 'street'], dataType: 'string', required: false },
      { field: 'city', label: 'City', aliases: ['city', 'town'], dataType: 'string', required: false },
      { field: 'country', label: 'Country', aliases: ['country', 'nation', 'region'], dataType: 'string', required: false },
      { field: 'latitude', label: 'Latitude', aliases: ['latitude', 'lat'], dataType: 'number', required: false },
      { field: 'longitude', label: 'Longitude', aliases: ['longitude', 'lon', 'lng'], dataType: 'number', required: false },
    ],
  },
  sites: {
    entityType: 'sites', table: 'sites', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Site Name', aliases: ['site', 'site name', 'name', 'location'], dataType: 'string', required: true },
      { field: 'code', label: 'Code', aliases: ['code', 'site code', 'site_code', 'reference', 'ref'], dataType: 'string', required: false },
      { field: 'address', label: 'Address', aliases: ['address', 'location', 'street'], dataType: 'string', required: false },
    ],
  },
  departments: {
    entityType: 'departments', table: 'departments', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Department Name', aliases: ['department', 'department name', 'name', 'dept'], dataType: 'string', required: true },
      { field: 'code', label: 'Code', aliases: ['code', 'department code', 'department_code', 'ref'], dataType: 'string', required: false },
      { field: 'siteId', label: 'Site', aliases: ['site id', 'site_id', 'site'], dataType: 'uuid', required: false, references: { table: 'sites', nameColumn: 'name', orgColumn: 'organization_id' } },
    ],
  },
  suppliers: {
    entityType: 'suppliers', table: 'suppliers', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Supplier Name', aliases: ['supplier', 'supplier name', 'vendor', 'name', 'supplier_name'], dataType: 'string', required: true },
      { field: 'code', label: 'Code', aliases: ['code', 'supplier code', 'supplier_code', 'vendor code', 'reference', 'ref'], dataType: 'string', required: false },
      { field: 'country', label: 'Country', aliases: ['country', 'nation'], dataType: 'string', required: false },
      { field: 'currency', label: 'Currency', aliases: ['currency', 'ccy', 'currency code'], dataType: 'string', required: false },
      { field: 'email', label: 'Email', aliases: ['email', 'email address', 'contact email'], dataType: 'email', required: false },
    ],
  },
  programs: {
    entityType: 'programs', table: 'sustainability_programs', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Program Name', aliases: ['program', 'program name', 'name', 'initiative'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc', 'details'], dataType: 'string', required: false },
      { field: 'category', label: 'Category', aliases: ['category', 'type', 'program category'], dataType: 'string', required: false, enumValues: ['general', 'carbon', 'energy', 'water', 'waste', 'biodiversity', 'social', 'governance'] },
    ],
  },
  goals: {
    entityType: 'goals', table: 'esg_goals', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Goal Name', aliases: ['goal', 'goal name', 'name', 'target name'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'esgPillar', label: 'ESG Pillar', aliases: ['esg pillar', 'esg_pillar', 'pillar'], dataType: 'string', required: false, enumValues: ['environment', 'social', 'governance'] },
      { field: 'targetValue', label: 'Target Value', aliases: ['target value', 'target_value', 'target', 'value'], dataType: 'number', required: false },
    ],
  },
  kpis: {
    entityType: 'kpis', table: 'sustainability_kpis', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'KPI Name', aliases: ['kpi', 'kpi name', 'name', 'metric'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom', 'measure unit'], dataType: 'string', required: false },
      { field: 'kpiType', label: 'KPI Type', aliases: ['kpi type', 'kpi_type', 'type'], dataType: 'string', required: false, enumValues: ['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean'] },
    ],
  },
  emission_factors: {
    entityType: 'emission_factors', table: 'emission_factors', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Name', aliases: ['name', 'factor name', 'emission factor'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'factorType', label: 'Factor Type', aliases: ['factor type', 'factor_type', 'type'], dataType: 'string', required: false },
      { field: 'category', label: 'Category', aliases: ['category', 'factor category'], dataType: 'string', required: false },
      { field: 'value', label: 'Value', aliases: ['value', 'factor value', 'emission value', 'co2'], dataType: 'number', required: true },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom'], dataType: 'string', required: false },
      { field: 'source', label: 'Source', aliases: ['source', 'source name', 'reference'], dataType: 'string', required: false },
      { field: 'effectiveDate', label: 'Effective Date', aliases: ['effective date', 'effective_date', 'date'], dataType: 'date', required: false },
    ],
  },
  emission_records: {
    entityType: 'emission_records', table: 'emission_records', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Record Name', aliases: ['name', 'record name', 'emission record'], dataType: 'string', required: true },
      { field: 'facilityName', label: 'Facility', aliases: ['facility', 'facility name', 'plant', 'factory', 'site'], dataType: 'string', required: true, references: { table: 'facilities', nameColumn: 'name', orgColumn: 'organization_id' } },
      { field: 'scope', label: 'Scope', aliases: ['scope', 'ghg scope', 'scope 1/2/3'], dataType: 'string', required: false, enumValues: ['scope1', 'scope2', 'scope3'] },
      { field: 'category', label: 'Category', aliases: ['category', 'emission category'], dataType: 'string', required: false },
      { field: 'value', label: 'Emission (tCO₂e)', aliases: ['value', 'emission', 'co2', 'co₂', 'co2e', 'tco2e', 'amount', 'quantity'], dataType: 'number', required: true },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom'], dataType: 'string', required: false },
      { field: 'period', label: 'Period', aliases: ['period', 'reporting period', 'year', 'date'], dataType: 'string', required: false },
    ],
  },
  carbon_projects: {
    entityType: 'carbon_projects', table: 'carbon_projects', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Project Name', aliases: ['project', 'project name', 'name', 'carbon project'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'status', label: 'Status', aliases: ['status', 'project status'], dataType: 'string', required: false },
      { field: 'owner', label: 'Owner', aliases: ['owner', 'owner name', 'manager'], dataType: 'string', required: false },
      { field: 'program', label: 'Program', aliases: ['program', 'program name'], dataType: 'string', required: false },
      { field: 'startDate', label: 'Start Date', aliases: ['start date', 'start_date', 'start'], dataType: 'date', required: false },
      { field: 'endDate', label: 'End Date', aliases: ['end date', 'end_date', 'end'], dataType: 'date', required: false },
    ],
  },
  carbon_offsets: {
    entityType: 'carbon_offsets', table: 'carbon_offsets', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Offset Name', aliases: ['name', 'offset name', 'carbon offset', 'credit'], dataType: 'string', required: true },
      { field: 'project', label: 'Project', aliases: ['project', 'project name', 'project id'], dataType: 'string', required: false },
      { field: 'quantity', label: 'Quantity', aliases: ['quantity', 'qty', 'credits', 'amount'], dataType: 'number', required: true },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom'], dataType: 'string', required: false },
      { field: 'status', label: 'Status', aliases: ['status'], dataType: 'string', required: false },
      { field: 'vintage', label: 'Vintage Year', aliases: ['vintage', 'vintage year', 'year'], dataType: 'number', required: false },
    ],
  },
  reduction_targets: {
    entityType: 'reduction_targets', table: 'sbti_targets', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Target Name', aliases: ['name', 'target name', 'reduction target'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'targetValue', label: 'Target (%)', aliases: ['target value', 'target_value', 'percentage', 'target', 'value', '%'], dataType: 'percentage', required: false },
      { field: 'baseYear', label: 'Base Year', aliases: ['base year', 'base_year', 'base year'], dataType: 'number', required: false },
      { field: 'targetYear', label: 'Target Year', aliases: ['target year', 'target_year', 'year'], dataType: 'number', required: false },
      { field: 'scope', label: 'Scope', aliases: ['scope'], dataType: 'string', required: false },
      { field: 'status', label: 'Status', aliases: ['status'], dataType: 'string', required: false },
    ],
  },
  environmental_records: {
    entityType: 'environmental_records', table: 'environmental_records', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Record Name', aliases: ['name', 'record name', 'environmental record'], dataType: 'string', required: true },
      { field: 'facilityName', label: 'Facility', aliases: ['facility', 'facility name', 'plant', 'site'], dataType: 'string', required: true, references: { table: 'facilities', nameColumn: 'name', orgColumn: 'organization_id' } },
      { field: 'type', label: 'Type', aliases: ['type', 'record type', 'category'], dataType: 'string', required: false },
      { field: 'value', label: 'Value', aliases: ['value', 'amount', 'quantity'], dataType: 'number', required: true },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom'], dataType: 'string', required: false },
      { field: 'date', label: 'Date', aliases: ['date', 'record date', 'period'], dataType: 'date', required: false },
    ],
  },
  esg_metrics: {
    entityType: 'esg_metrics', table: 'esg_metrics', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Metric Name', aliases: ['name', 'metric name', 'esg metric'], dataType: 'string', required: true },
      { field: 'description', label: 'Description', aliases: ['description', 'desc'], dataType: 'string', required: false },
      { field: 'category', label: 'Category', aliases: ['category', 'metric category'], dataType: 'string', required: false },
      { field: 'unit', label: 'Unit', aliases: ['unit', 'uom'], dataType: 'string', required: false },
    ],
  },
  reporting_periods: {
    entityType: 'reporting_periods', table: 'reporting_periods', nameColumn: 'name',
    fields: [
      { field: 'name', label: 'Period Name', aliases: ['name', 'period name', 'reporting period', 'period'], dataType: 'string', required: true },
      { field: 'startDate', label: 'Start Date', aliases: ['start date', 'start_date', 'start'], dataType: 'date', required: true },
      { field: 'endDate', label: 'End Date', aliases: ['end date', 'end_date', 'end'], dataType: 'date', required: true },
      { field: 'status', label: 'Status', aliases: ['status', 'period status'], dataType: 'string', required: false },
    ],
  },
  users: {
    entityType: 'users', table: 'users', nameColumn: 'email',
    fields: [
      { field: 'email', label: 'Email', aliases: ['email', 'email address', 'user email'], dataType: 'email', required: true },
      { field: 'firstName', label: 'First Name', aliases: ['first name', 'first_name', 'firstname'], dataType: 'string', required: false },
      { field: 'lastName', label: 'Last Name', aliases: ['last name', 'last_name', 'lastname'], dataType: 'string', required: false },
      { field: 'role', label: 'Role', aliases: ['role', 'user role', 'position'], dataType: 'string', required: false },
    ],
  },
  documents: {
    entityType: 'documents', table: 'worker_documents', nameColumn: 'title',
    fields: [
      { field: 'title', label: 'Title', aliases: ['title', 'document title', 'name', 'file name'], dataType: 'string', required: true },
      { field: 'category', label: 'Category', aliases: ['category', 'document category', 'type'], dataType: 'string', required: false },
      { field: 'fileUrl', label: 'File URL', aliases: ['file url', 'file_url', 'url', 'path'], dataType: 'string', required: true },
      { field: 'fileType', label: 'File Type', aliases: ['file type', 'file_type', 'mime type'], dataType: 'string', required: false },
      { field: 'issuedDate', label: 'Issued Date', aliases: ['issued date', 'issued_date', 'date'], dataType: 'date', required: false },
      { field: 'expiryDate', label: 'Expiry Date', aliases: ['expiry date', 'expiry_date', 'expires'], dataType: 'date', required: false },
    ],
  },
};

export const DUPLICATE_KEY_FIELDS: Record<string, string[]> = {
  facilities: ['name', 'code'],
  sites: ['name', 'code'],
  departments: ['name', 'code'],
  suppliers: ['name', 'code'],
  programs: ['name'],
  goals: ['name'],
  kpis: ['name'],
  emission_factors: ['name', 'code'],
  emission_records: ['name', 'facilityName'],
  carbon_projects: ['name'],
  carbon_offsets: ['name'],
  reduction_targets: ['name'],
  environmental_records: ['name', 'facilityName'],
  esg_metrics: ['name'],
  reporting_periods: ['name'],
  users: ['email'],
  documents: ['title', 'fileUrl'],
};

const ENUM_VALUES: Record<string, string[]> = {
  facilityType: ['plant', 'office', 'warehouse', 'store', 'factory', 'lab', 'data_center', 'other'],
  category: ['general', 'carbon', 'energy', 'water', 'waste', 'biodiversity', 'social', 'governance'],
  esgPillar: ['environment', 'social', 'governance'],
  kpiType: ['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean'],
  scope: ['scope1', 'scope2', 'scope3'],
};

// ---------------------------------------------------------------------
// Smart Import Engine
// ---------------------------------------------------------------------
export class SmartImportEngine {
  // ---- File validation (Part 14: Security) ----
  validateFile(input: { fileName: string; fileSize: number; mimeType?: string | null }): { ok: true } | { ok: false; reason: string; suggestedFix: string } {
    const ext = input.fileName.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return { ok: false, reason: `File extension ".${ext}" is not supported.`, suggestedFix: 'Upload a CSV, XLSX, JSON, XML, PDF, DOCX, TXT, or image file.' };
    }
    if (input.fileSize > MAX_FILE_SIZE) {
      return { ok: false, reason: `File is ${Math.round(input.fileSize / 1024 / 1024)} MB. Maximum allowed is 25 MB.`, suggestedFix: 'Split the file into smaller parts or reduce the file size.' };
    }
    if (input.mimeType && !ALLOWED_MIME_TYPES.has(input.mimeType)) {
      return { ok: false, reason: `MIME type "${input.mimeType}" is not supported.`, suggestedFix: 'Upload a file with a supported MIME type.' };
    }
    return { ok: true };
  }

  // ---- Universal parsing (Part 1: Universal Import Engine) ----
  parseFile(input: { fileName: string; content: Buffer; fileType?: string }): { ok: true; records: Array<Record<string, unknown>>; columns: string[] } | { ok: false; reason: string; row?: number; suggestedFix: string } {
    const ext = input.fileName.split('.').pop()?.toLowerCase() ?? '';
    const content = input.content.toString('utf8');
    try {
      if (ext === 'csv') return this.parseCsv(content);
      if (ext === 'json') return this.parseJson(content);
      if (ext === 'xml') return this.parseXml(content);
      if (ext === 'xlsx') return { ok: false, reason: 'XLSX parsing requires the office parser. Records must be provided as JSON.', suggestedFix: 'Select the file in the client so rows are extracted and sent as JSON records.' };
      return { ok: false, reason: `Unsupported import file type ".${ext}".`, suggestedFix: 'Only CSV, JSON, XML, and XLSX (client-extracted) are supported for tabular import.' };
    } catch (err: any) {
      return { ok: false, reason: `Failed to parse file: ${err?.message ?? String(err)}`, suggestedFix: 'Check the file encoding (UTF-8 required) and structure.' };
    }
  }

  private parseCsv(content: string): { ok: true; records: Array<Record<string, unknown>>; columns: string[] } {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return { ok: true, records: [], columns: [] };
    const header = this.splitCsvLine(lines[0]);
    const columns = header.map((h) => h.trim()).filter(Boolean);
    const records: Array<Record<string, unknown>> = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = this.splitCsvLine(lines[i]);
      const record: Record<string, unknown> = {};
      for (let c = 0; c < columns.length; c++) {
        record[columns[c]] = cells[c]?.trim() ?? '';
      }
      records.push(record);
    }
    return { ok: true, records, columns };
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(current); current = '';
      } else {
        current += ch;
      }
    }
    out.push(current);
    return out;
  }

  private parseJson(content: string): { ok: true; records: Array<Record<string, unknown>>; columns: string[] } {
    const data = JSON.parse(content);
    const records = (Array.isArray(data) ? data : (Array.isArray(data.records) ? data.records : [data])) as Array<Record<string, unknown>>;
    const columns = [...new Set(records.flatMap((r) => Object.keys(r)))];
    return { ok: true, records, columns };
  }

  private parseXml(content: string): { ok: true; records: Array<Record<string, unknown>>; columns: string[] } {
    const records: Array<Record<string, unknown>> = [];
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/gi;
    let match: RegExpExecArray | null;
    const columns = new Set<string>();
    while ((match = rowRegex.exec(content)) !== null) {
      const rowContent = match[1];
      const record: Record<string, unknown> = {};
      const cellRegex = /<([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*>([\s\S]*?)<\/\1>/g;
      let cell: RegExpExecArray | null;
      while ((cell = cellRegex.exec(rowContent)) !== null) {
        const key = cell[1].trim();
        const val = cell[2].trim();
        record[key] = val;
        columns.add(key);
      }
      if (Object.keys(record).length > 0) records.push(record);
    }
    if (records.length === 0) {
      // Fallback: generic XML object
      const json = this.xmlToJson(content);
      if (json && typeof json === 'object') {
        records.push(json as Record<string, unknown>);
        Object.keys(json as Record<string, unknown>).forEach((k) => columns.add(k));
      }
    }
    return { ok: true, records, columns: [...columns] };
  }

  private xmlToJson(xml: string): unknown {
    const flat: Record<string, unknown> = {};
    const tagRegex = /<([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(xml)) !== null) {
      const key = m[1].trim();
      const val = m[2].trim();
      if (!val.includes('<')) flat[key] = val;
    }
    return flat;
  }

  // ---- Smart column mapping (Part 4) ----
  suggestColumnMappings(columns: string[], entityType: string): ColumnMapping[] {
    const def = IMPORT_ENTITY_DEFS[entityType];
    if (!def) return [];
    const normalized = columns.map((c) => this.normalizeColumnName(c));
    const mappings: ColumnMapping[] = [];
    const usedTargets = new Set<string>();

    for (let i = 0; i < columns.length; i++) {
      const source = columns[i];
      const norm = normalized[i];
      let bestField: EntityFieldDef | null = null;
      let bestScore = 0;
      for (const field of def.fields) {
        if (usedTargets.has(field.field)) continue;
        const score = this.matchScore(norm, field);
        if (score > bestScore) { bestScore = score; bestField = field; }
      }
      const field = bestField;
      mappings.push({
        sourceColumn: source,
        targetField: field ? field.field : null,
        confidence: field ? bestScore : 0,
        isAutoMapped: !!field,
        isRequired: field?.required ?? false,
        dataType: field?.dataType ?? 'string',
        sampleValues: [],
      });
      if (field) usedTargets.add(field.field);
    }
    return mappings;
  }

  private normalizeColumnName(col: string): string {
    return col.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '');
  }

  private matchScore(norm: string, field: EntityFieldDef): number {
    const fieldNorm = this.normalizeColumnName(field.label);
    if (norm === fieldNorm) return 1;
    const fieldNormShort = this.normalizeColumnName(field.field);
    if (norm === fieldNormShort) return 1;
    for (const alias of field.aliases) {
      const aliasNorm = this.normalizeColumnName(alias);
      if (norm === aliasNorm) return 0.95;
    }
    for (const alias of field.aliases) {
      const aliasNorm = this.normalizeColumnName(alias);
      if (norm.includes(aliasNorm) || aliasNorm.includes(norm)) return 0.7;
    }
    if (norm.includes(fieldNormShort) || fieldNormShort.includes(norm)) return 0.5;
    return 0;
  }

  // ---- Validation engine (Part 5) ----
  async validateRecords(orgId: string, entityType: string, records: Array<Record<string, unknown>>): Promise<ValidationReport> {
    const def = IMPORT_ENTITY_DEFS[entityType];
    const report: ValidationReport = { totalRows: records.length, validRows: 0, invalidRows: 0, errors: [], warnings: [] };
    let valid = 0;
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // row 1 is header
      const normalized = this.normalizeRecord(record, entityType);
      const issues = await this.validateRecord(orgId, entityType, def, normalized, rowNum);
      const errors = issues.filter((x) => x.severity === 'error');
      report.errors.push(...errors);
      report.warnings.push(...issues.filter((x) => x.severity === 'warning'));
      if (errors.length === 0) valid++;
    }
    report.validRows = valid;
    report.invalidRows = records.length - valid;
    return report;
  }

  normalizeRecord(record: Record<string, unknown>, entityType: string): Record<string, unknown> {
    const def = IMPORT_ENTITY_DEFS[entityType];
    if (!def) return record;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      const norm = this.normalizeColumnName(key);
      let matched = false;
      for (const field of def.fields) {
        const fieldNorm = this.normalizeColumnName(field.label);
        const fieldShort = this.normalizeColumnName(field.field);
        if (norm === fieldNorm || norm === fieldShort) {
          out[field.field] = value;
          matched = true;
          break;
        }
        for (const alias of field.aliases) {
          if (norm === this.normalizeColumnName(alias)) {
            out[field.field] = value;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (!matched) out[key] = value;
    }
    return out;
  }

  private async validateRecord(orgId: string, entityType: string, def: EntityImportDef | undefined, record: Record<string, unknown>, row: number): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    if (!def) {
      issues.push({ field: '*', row, reason: `Unknown entity type "${entityType}"`, severity: 'error', suggestedFix: 'Select a supported import type.' });
      return issues;
    }
    for (const field of def.fields) {
      const raw = record[field.field];
      const value = this.coerceValue(raw, field.dataType);
      if (field.required && (value === undefined || value === null || value === '')) {
        issues.push({ field: field.field, row, reason: `Required field "${field.label}" is empty.`, severity: 'error', suggestedFix: `Provide a value for "${field.label}".` });
        continue;
      }
      if (value === undefined || value === null || value === '') continue;
      const typeIssue = this.validateType(value, field, row);
      if (typeIssue) { issues.push(typeIssue); continue; }
      if (field.enumValues && field.enumValues.length > 0) {
        const strVal = String(value).toLowerCase();
        if (!field.enumValues.includes(strVal)) {
          issues.push({
            field: field.field, row, reason: `Value "${value}" is not a valid "${field.label}".`, severity: 'error',
            suggestedFix: `Use one of: ${field.enumValues.join(', ')}.`,
          });
        }
      }
      if (field.references) {
        const refIssue = await this.validateReference(orgId, record, field, value, row);
        if (refIssue) issues.push(refIssue);
      }
    }
    return issues;
  }

  private async validateReference(orgId: string, record: Record<string, unknown>, field: EntityFieldDef, value: unknown, row: number): Promise<ValidationIssue | null> {
    const ref = field.references!;
    try {
      if (field.field === 'facilityName') {
        const result = await query(
          `SELECT id FROM ${ref.table} WHERE ${ref.orgColumn} = $1 AND name ILIKE $2 LIMIT 1`,
          [orgId, `%${String(value)}%`],
        );
        if (result.rows.length === 0) {
          return { field: field.field, row, reason: `Facility "${value}" was not found.`, severity: 'error', suggestedFix: 'Create the facility first or fix the name.' };
        }
      }
    } catch { /* ignore FK check failures */ }
    return null;
  }

  private coerceValue(raw: unknown, dataType: ColumnDataType): unknown {
    if (raw === undefined || raw === null || raw === '') return raw;
    if (dataType === 'number' || dataType === 'percentage' || dataType === 'currency') {
      const num = Number(String(raw).replace(/[,$%\s]/g, ''));
      return Number.isFinite(num) ? num : raw;
    }
    if (dataType === 'boolean') {
      const str = String(raw).toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(str)) return true;
      if (['false', 'no', 'n', '0'].includes(str)) return false;
      return raw;
    }
    if (dataType === 'date') {
      const str = String(raw);
      if (!Number.isNaN(Date.parse(str))) return str;
      return raw;
    }
    return raw;
  }

  private validateType(value: unknown, field: EntityFieldDef, row: number): ValidationIssue | null {
    switch (field.dataType) {
      case 'number':
      case 'percentage':
      case 'currency': {
        const num = Number(value);
        if (!Number.isFinite(num)) {
          return { field: field.field, row, reason: `"${field.label}" must be a valid number.`, severity: 'error', suggestedFix: `Use a numeric value for "${field.label}".`, value };
        }
        if (field.dataType === 'percentage' && (num < 0 || num > 100)) {
          return { field: field.field, row, reason: `"${field.label}" must be between 0 and 100.`, severity: 'error', suggestedFix: 'Use a percentage value between 0 and 100.', value };
        }
        break;
      }
      case 'email': {
        const email = String(value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { field: field.field, row, reason: `"${email}" is not a valid email address.`, severity: 'error', suggestedFix: 'Use a valid email format like user@example.com.', value };
        }
        break;
      }
      case 'uuid': {
        const uuid = String(value);
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
          return { field: field.field, row, reason: `"${value}" is not a valid UUID.`, severity: 'error', suggestedFix: 'Use a valid UUID format.', value };
        }
        break;
      }
    }
    return null;
  }

  // ---- Duplicate detection (Part 6) ----
  async detectDuplicates(orgId: string, jobId: string, entityType: string, records: Array<Record<string, unknown>>): Promise<DuplicateMatch[]> {
    const def = IMPORT_ENTITY_DEFS[entityType];
    if (!def) return [];
    const keyFields = DUPLICATE_KEY_FIELDS[entityType] ?? ['name'];
    const matches: DuplicateMatch[] = [];
    const seen = new Map<string, string>(); // key -> validation queue id

    const vqResult = await query(
      `SELECT id, row_number, normalized_data FROM data_hub_validation_queue
        WHERE import_job_id = $1 AND organization_id = $2 ORDER BY row_number ASC`,
      [jobId, orgId],
    );

    for (const row of vqResult.rows) {
      const data = typeof row.normalized_data === 'object' && row.normalized_data ? (row.normalized_data as Record<string, unknown>) : {};
      for (const keyField of keyFields) {
        const keyVal = String(data[keyField] ?? data[this.toCamel(keyField)] ?? '').trim().toLowerCase();
        if (!keyVal) continue;
        const dupKey = `${keyField}:${keyVal}`;
        const existingId = seen.get(dupKey);
        if (existingId) {
          const existing = await query(
            `SELECT id, row_number FROM data_hub_validation_queue WHERE id = $1`,
            [existingId],
          );
          const confidence = existing.rows[0]?.row_number && row.row_number ? 0.95 : 0.8;
          const match: DuplicateMatch = {
            id: randomUUID(),
            duplicateKey: dupKey,
            duplicateType: keyField === 'email' ? 'email' : keyField === 'fileUrl' ? 'document_hash' : keyField,
            confidence,
            action: 'skip',
            resolved: false,
            validationQueueId: String(row.id),
            duplicateOfValidationQueueId: existingId,
          };
          matches.push(match);
        } else {
          seen.set(dupKey, String(row.id));
        }
      }
    }

    // Also check against existing database rows
    const table = def.table;
    const orgCol = def.fields.some((f) => f.field === 'organization_id') ? 'organization_id' : 'organization_id';
    for (const keyField of keyFields) {
      try {
        const dbResult = await query(
          `SELECT id, ${keyField === 'email' ? 'email' : def.nameColumn} FROM ${table} WHERE ${orgCol} = $1 AND ${keyField === 'email' ? 'email' : def.nameColumn} ILIKE ANY($2) LIMIT 500`,
          [orgId, records.map((r) => `%${String(r[keyField] ?? r[this.toCamel(keyField)] ?? '')}%`).filter((v) => v.length > 2)],
        );
        const existingNames = new Set(dbResult.rows.map((r) => String(r[def.nameColumn] ?? r.email ?? '').toLowerCase()));
        for (const record of records) {
          const val = String(record[keyField] ?? record[this.toCamel(keyField)] ?? '').trim().toLowerCase();
          if (val && existingNames.has(val)) {
            const vq = await query(
              `SELECT id FROM data_hub_validation_queue
                WHERE import_job_id = $1 AND organization_id = $2 AND row_number = $3 LIMIT 1`,
              [jobId, orgId, (records.indexOf(record) + 2)],
            );
            if (vq.rows[0]) {
              matches.push({
                id: randomUUID(),
                duplicateKey: `${keyField}:${val}`,
                duplicateType: 'existing_db',
                confidence: 0.9,
                action: 'skip',
                resolved: false,
                validationQueueId: String(vq.rows[0].id),
                duplicateOfValidationQueueId: null,
              });
            }
          }
        }
      } catch { /* table may not exist for this entity */ }
    }

    // Persist to data_hub_import_duplicates
    for (const match of matches) {
      await query(
        `INSERT INTO data_hub_import_duplicates (id, organization_id, import_job_id, validation_queue_id, duplicate_of_validation_queue_id, duplicate_key, duplicate_type, confidence, action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [match.id, orgId, jobId, match.validationQueueId, match.duplicateOfValidationQueueId, match.duplicateKey, match.duplicateType, match.confidence, match.action],
      );
      await query(
        `UPDATE data_hub_validation_queue
            SET duplicate_of = $1, duplicate_action = $2, duplicate_confidence = $3, updated_at = now()
          WHERE id = $4`,
        [match.duplicateOfValidationQueueId, match.action, match.confidence, match.validationQueueId],
      );
    }

    const summary: Record<string, number> = {};
    for (const m of matches) summary[m.duplicateType] = (summary[m.duplicateType] ?? 0) + 1;
    await query(
      `UPDATE data_hub_import_jobs SET duplicate_summary = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(summary), jobId],
    );

    return matches;
  }

  private toCamel(s: string): string {
    return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  }

  // ---- Document auto-classification (Part 8) ----
  classifyDocument(input: { fileName: string; title: string; category?: string | null; metadata?: Record<string, unknown> }): DocumentClassification {
    const text = `${input.fileName} ${input.title} ${input.category ?? ''}`.toLowerCase();
    const rules: Array<{ classification: string; keywords: string[]; weight: number }> = [
      { classification: 'policy', keywords: ['policy', 'procedure', 'guideline', 'standard operating', 'sop'], weight: 1 },
      { classification: 'certificate', keywords: ['certificate', 'certification', 'iso', 'accreditation', 'license'], weight: 1 },
      { classification: 'invoice', keywords: ['invoice', 'bill', 'statement', 'receipt'], weight: 1 },
      { classification: 'audit_report', keywords: ['audit', 'audit report', 'internal audit', 'external audit', 'audit finding'], weight: 1 },
      { classification: 'utility_bill', keywords: ['utility', 'electricity bill', 'gas bill', 'water bill', 'energy bill', 'meter'], weight: 1 },
      { classification: 'training', keywords: ['training', 'course', 'workshop', 'certificate of completion', 'training record'], weight: 1 },
      { classification: 'supplier', keywords: ['supplier', 'vendor', 'purchase order', 'po', 'contract'], weight: 1 },
      { classification: 'carbon', keywords: ['carbon', 'ghg', 'greenhouse', 'emission', 'co2', 'co₂', 'sbti', 'climate'], weight: 1 },
      { classification: 'environmental', keywords: ['environmental', 'environment', 'waste', 'water', 'biodiversity', 'chemical', 'spill'], weight: 1 },
      { classification: 'esg', keywords: ['esg', 'sustainability report', 'csr', 'disclosure'], weight: 1 },
      { classification: 'compliance', keywords: ['compliance', 'regulatory', 'legal', 'law', 'act'], weight: 1 },
      { classification: 'evidence', keywords: ['evidence', 'proof', 'attachment'], weight: 0.6 },
    ];

    let best: { classification: string; score: number } = { classification: 'unknown', score: 0 };
    for (const rule of rules) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (text.includes(kw)) score += rule.weight;
      }
      if (score > best.score) best = { classification: rule.classification, score };
    }
    const confidence = best.score > 0 ? Math.min(0.95, 0.4 + best.score * 0.2) : 0.15;
    return {
      id: randomUUID(),
      documentId: '',
      classification: best.classification,
      confidence: Number(confidence.toFixed(2)),
      method: 'heuristic',
      metadata: { fileName: input.fileName, keywords: best.score > 0 ? [best.classification] : [] },
    };
  }

  async persistClassification(orgId: string, documentId: string, classification: DocumentClassification, userId: string | null): Promise<void> {
    await query(
      `INSERT INTO data_hub_document_classifications (id, organization_id, document_id, classification, confidence, method, classified_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [randomUUID(), orgId, documentId, classification.classification, classification.confidence, classification.method, userId, JSON.stringify(classification.metadata)],
    );
  }

  // ---- Progress tracking (Part 10: Background Jobs) ----
  async createProgressStage(orgId: string, jobId: string, stage: ImportStage, total: number, message: string): Promise<ImportProgress> {
    const result = await query(
      `INSERT INTO data_hub_import_progress (id, organization_id, import_job_id, stage, status, progress, total, processed, message)
       VALUES ($1, $2, $3, $4, 'queued', 0, $5, 0, $6)
       RETURNING *`,
      [randomUUID(), orgId, jobId, stage, total, message],
    );
    return this.mapProgress(result.rows[0]);
  }

  async updateProgress(orgId: string, jobId: string, stage: ImportStage, updates: { progress?: number; processed?: number; status?: string; message?: string; error?: string }): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [orgId, jobId, stage];
    if (updates.progress !== undefined) { params.push(updates.progress); sets.push(`progress = $${params.length}`); }
    if (updates.processed !== undefined) { params.push(updates.processed); sets.push(`processed = $${params.length}`); }
    if (updates.status !== undefined) {
      params.push(updates.status);
      sets.push(`status = $${params.length}`);
      if (updates.status === 'running' && updates.progress === 0) sets.push(`started_at = COALESCE(started_at, now())`);
      if (updates.status === 'completed') sets.push(`completed_at = now()`);
    }
    if (updates.message !== undefined) { params.push(updates.message); sets.push(`message = $${params.length}`); }
    if (updates.error !== undefined) { params.push(updates.error); sets.push(`error = $${params.length}`); }
    if (sets.length === 0) return;
    sets.push(`updated_at = now()`);
    await query(
      `UPDATE data_hub_import_progress SET ${sets.join(', ')} WHERE organization_id = $1 AND import_job_id = $2 AND stage = $3`,
      params,
    );
    // Mirror progress on the job row
    if (updates.progress !== undefined) {
      await query(
        `UPDATE data_hub_import_jobs SET progress = GREATEST(progress, $1), updated_at = now() WHERE id = $2`,
        [updates.progress, jobId],
      );
    }
    if (updates.status === 'failed') {
      await query(
        `UPDATE data_hub_import_jobs SET status = 'failed', last_error = $1, updated_at = now() WHERE id = $2`,
        [updates.error ?? 'Import failed', jobId],
      );
    }
    if (updates.status === 'cancelled') {
      await query(
        `UPDATE data_hub_import_jobs SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = $2`,
        [jobId, jobId],
      );
    }
  }

  async listProgress(orgId: string, jobId: string): Promise<ImportProgress[]> {
    const result = await query(
      `SELECT * FROM data_hub_import_progress WHERE organization_id = $1 AND import_job_id = $2 ORDER BY created_at ASC`,
      [orgId, jobId],
    );
    return result.rows.map((r) => this.mapProgress(r));
  }

  private mapProgress(row: Record<string, unknown>): ImportProgress {
    return {
      id: String(row.id),
      importJobId: String(row.import_job_id),
      stage: String(row.stage) as ImportStage,
      status: String(row.status) as ImportProgress['status'],
      progress: Number(row.progress ?? 0),
      total: Number(row.total ?? 0),
      processed: Number(row.processed ?? 0),
      message: row.message ? String(row.message) : null,
      error: row.error ? String(row.error) : null,
      startedAt: row.started_at ? String(row.started_at) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
    };
  }

  // ---- File hash (Part 7: no duplicate uploads) ----
  hashFile(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  async findExistingByHash(orgId: string, hash: string): Promise<string | null> {
    const result = await query(
      `SELECT id FROM data_hub_import_jobs WHERE organization_id = $1 AND file_hash = $2 AND status NOT IN ('failed','cancelled') LIMIT 1`,
      [orgId, hash],
    );
    return result.rows[0] ? String(result.rows[0].id) : null;
  }

  // ---- Map import entity type to sync engine entity type (Part 9) ----
  private mapEntityToSyncType(entityType: string): SyncEntityType | null {
    const map: Record<string, SyncEntityType> = {
      facilities: 'facility',
      suppliers: 'supplier',
      carbon_projects: 'project',
      kpis: 'kpi',
    };
    return map[entityType] ?? null;
  }

  // ---- Propagation through sync engine (Part 9) ----
  async propagateThroughSyncEngine(orgId: string, userId: string, entityType: string, entityId: string, entityName: string): Promise<{ targets: string[] }> {
    const syncType = this.mapEntityToSyncType(entityType);
    if (syncType) {
      try {
        const result = await syncEngineService.run(orgId, userId, { entityType: syncType, entityId, jobType: 'background' });
        return { targets: result.propagated > 0 ? [String(result.propagated)] : [] };
      } catch {
        // Fall through to the activity engine
      }
    }
    // Fall back to the existing propagation service (activity timeline)
    const { PropagationServiceInstance } = await import('./data-hub.service.js');
    return PropagationServiceInstance.synchronize(orgId, userId, entityType, entityId, entityName);
  }

  // ---- Standardized error helpers ----
  formatErrors(report: ValidationReport): Array<{ field: string; row: number; reason: string; suggestedFix?: string }> {
    return report.errors.map((e) => ({ field: e.field, row: e.row, reason: e.reason, suggestedFix: e.suggestedFix }));
  }
}

// ---------------------------------------------------------------------
// Background job queue (Part 10)
// ---------------------------------------------------------------------
const RUNNING_JOBS = new Map<string, { cancelled: boolean }>();

export class SmartImportJobQueue {
  private engine = new SmartImportEngine();

  async enqueue(orgId: string, userId: string, jobId: string, work: (progress: (pct: number, processed: number, message: string) => Promise<void>) => Promise<void>): Promise<void> {
    RUNNING_JOBS.set(jobId, { cancelled: false });
    const run = RUNNING_JOBS.get(jobId)!;
    try {
      await query(`UPDATE data_hub_import_jobs SET status = 'running', started_at = now(), updated_at = now() WHERE id = $1`, [jobId]);
      await work(async (pct, processed, message) => {
        if (run.cancelled) throw new Error('Import cancelled by user');
        await this.engine.updateProgress(orgId, jobId, 'commit', { progress: pct, processed, status: 'running', message });
        await ActivityServiceInstance.log(orgId, userId, 'import.progress', { type: 'import_job', id: jobId }, { progress: pct, message });
      });
      await query(
        `UPDATE data_hub_import_jobs SET status = 'committed', progress = 100, completed_at = now(), updated_at = now() WHERE id = $1`,
        [jobId],
      );
      await this.engine.updateProgress(orgId, jobId, 'complete', { progress: 100, status: 'completed', message: 'Import completed' });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const cancelled = /cancelled/i.test(msg);
      if (cancelled) {
        await this.engine.updateProgress(orgId, jobId, 'commit', { status: 'cancelled', message: 'Import cancelled' });
      } else {
        await this.engine.updateProgress(orgId, jobId, 'commit', { status: 'failed', error: msg });
      }
    } finally {
      RUNNING_JOBS.delete(jobId);
    }
  }

  cancel(jobId: string): boolean {
    const run = RUNNING_JOBS.get(jobId);
    if (!run) return false;
    run.cancelled = true;
    return true;
  }

  isRunning(jobId: string): boolean {
    return RUNNING_JOBS.has(jobId);
  }
}

export const SmartImportEngineInstance = new SmartImportEngine();
export const SmartImportJobQueueInstance = new SmartImportJobQueue();