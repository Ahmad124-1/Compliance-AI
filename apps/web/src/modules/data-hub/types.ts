export interface DataHubDashboardSummary {
  organization: { id: string; name: string } | null;
  counts: { facilities: number; sites: number; departments: number; suppliers: number; programs: number; goals: number; kpis: number; documents: number; emissionFactors: number; standards: number; frameworks: number };
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
  projects: Array<Record<string, unknown>>;
  reportingPeriods: Array<Record<string, unknown>>;
  emissionFactors: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  units: Array<Record<string, unknown>>;
  currencies: Array<Record<string, unknown>>;
  countries: Array<Record<string, unknown>>;
  standards: Array<Record<string, unknown>>;
  frameworks: Array<Record<string, unknown>>;
}

export type SyncEntityType =
  | 'facility'
  | 'site'
  | 'department'
  | 'supplier'
  | 'program'
  | 'goal'
  | 'kpi'
  | 'project'
  | 'reporting_period'
  | 'emission_factor'
  | 'document'
  | 'user';

export interface MasterDataLookupRow {
  value: string;
  label: string;
}

// Backend GET /sync/lookup/:entity returns Array<{ value, label }> directly.
export type MasterDataLookupResponse = MasterDataLookupRow[];

export interface SyncStatusEntry {
  entityType: SyncEntityType;
  entityLabel: string;
  lastSyncedAt: string | null;
  syncedBy: string | null;
  totalRecords: number;
  syncMode: string | null;
}

export interface SyncResult {
  entityType: SyncEntityType;
  id: string;
  name: string;
  inserted: boolean;
  matchedById: boolean;
  matchedByKey: boolean;
  duplicate: boolean;
}

// ---------------------------------------------------------------------
// Sprint 4.3 — Synchronization Engine types
// ---------------------------------------------------------------------

export type SyncEngineEntityType =
  | 'facility' | 'supplier' | 'project' | 'kpi'
  | 'carbon_record' | 'document' | 'all';

export type SyncJobType = 'manual' | 'background' | 'retry';
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'conflict';

export interface SyncRunResult {
  jobId: string;
  entityType: SyncEngineEntityType;
  status: SyncJobStatus;
  propagated: number;
  skipped: number;
  conflicts: number;
  failed: number;
  attempts: number;
  summary: Record<string, unknown>;
}

export interface SyncStatusEntryV2 {
  entity_type: string;
  entity_type_label: string;
  last_synced_at: string | null;
  total_records: number;
  sync_mode: string;
  synced_by: string | null;
  metadata: Record<string, unknown>;
}

export interface SyncActivityLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  sourceModule: string | null;
  targetModule: string | null;
  status: 'success' | 'error' | 'skipped' | 'conflict';
  details: Record<string, unknown>;
  createdAt: string;
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

export interface DataHubQueue {
  pending: ValidationQueueItem[];
  processing: ValidationQueueItem[];
  counts: QueueStatusCounts[];
}

export interface ImportPreview {
  job: ImportJob;
  records: ValidationQueueItem[];
}

export interface DataHubSettings {
  entityTypes: string[];
  aiExtraction: { capabilities: { name: string; supportedTypes: string[] }[]; enabled: boolean };
  reportAggregation: Record<string, unknown>;
  validationActions: string[];
  importStatuses: string[];
}

// ---------------------------------------------------------------------
// Phase 5.1 — Smart Data Collection & Ingestion types
// ---------------------------------------------------------------------

export type ImportStage = 'upload' | 'parse' | 'map' | 'validate' | 'duplicates' | 'commit' | 'sync' | 'complete';
export type ImportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'uploaded' | 'committed';
export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean' | 'percentage' | 'currency' | 'uuid' | 'email';
export type DuplicateAction = 'skip' | 'replace' | 'merge' | 'create_new';

export interface ImportColumnMapping {
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

export interface ImportProgressEntry {
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

export interface ImportJobDetail {
  job: ImportJob;
  progress: ImportProgressEntry[];
  duplicates: DuplicateMatch[];
}

export interface DocumentClassification {
  id: string;
  documentId: string;
  classification: string;
  confidence: number;
  method: string;
  metadata: Record<string, unknown>;
}
