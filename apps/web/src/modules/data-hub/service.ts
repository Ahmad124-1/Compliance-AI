import { dataHubApi } from './api.js';
import type {
  DataHubDashboardSummary,
  MasterDataCollection,
  MasterDataLookupResponse,
  SyncEntityType,
  SyncResult,
  SyncStatusEntry,
  SyncEngineEntityType,
  SyncJobType,
  SyncRunResult,
  SyncStatusEntryV2,
  SyncActivityLogEntry,
  ImportJob,
  ImportJobDetail,
  ImportPreview,
  ValidationReport,
  HubDocument,
  ValidationQueueItem,
  DataHubActivityEntry,
  DataHubQueue,
  DataHubSettings,
} from './types.js';

/**
 * Sprint 4.1 — centralized master-data lookup. Every form dropdown across all
 * modules (carbon, sustainability, ESG, environment, reports) must use these
 * helpers so every module reads the exact same records from the Data Hub.
 */
export const masterDataLookup = {
  facilities: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('facility'),
  sites: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('site'),
  departments: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('department'),
  suppliers: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('supplier'),
  programs: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('program'),
  goals: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('goal'),
  kpis: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('kpi'),
  projects: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('project'),
  reportingPeriods: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('reporting_period'),
  emissionFactors: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('emission_factor'),
  documents: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('document'),
  users: (): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup('user'),
};

export const dataHubService = {
  getDashboard: (): Promise<DataHubDashboardSummary> => dataHubApi.dashboard(),
  getMasterData: (): Promise<MasterDataCollection> => dataHubApi.masterData(),
  getStatistics: (): Promise<Record<string, unknown>> => dataHubApi.statistics(),
  getQueue: (): Promise<DataHubQueue> => dataHubApi.queue(),
  getActivity: (limit?: number): Promise<DataHubActivityEntry[]> => dataHubApi.activity(limit),
  getDocuments: (category?: string): Promise<HubDocument[]> => dataHubApi.documents(category),
  createDocument: (input: Parameters<typeof dataHubApi.createDocument>[0]): Promise<HubDocument> => dataHubApi.createDocument(input),
  getValidation: (status?: string, entityType?: string): Promise<ValidationQueueItem[]> => dataHubApi.validation(status, entityType),
  reviewValidation: (id: string, action: string, note?: string, data?: Record<string, unknown>): Promise<ValidationQueueItem> =>
    dataHubApi.reviewValidation(id, action, note, data),
  createImport: (input: Parameters<typeof dataHubApi.createImport>[0]): Promise<ImportJob> => dataHubApi.createImport(input),
  previewImport: (importJobId: string): Promise<ImportPreview> => dataHubApi.previewImport(importJobId),
  commitImport: (importJobId: string, entityType?: string): Promise<ImportJob> => dataHubApi.commitImport(importJobId, entityType),
  validateImport: (importJobId: string, entityType: string, records: Array<Record<string, unknown>>): Promise<ValidationReport> =>
    dataHubApi.validateImport(importJobId, entityType, records),
  importJobs: (status?: string): Promise<ImportJob[]> => dataHubApi.importJobs(status),
  importJobDetail: (id: string): Promise<ImportJobDetail> => dataHubApi.importJobDetail(id),
  retryImportJob: (id: string): Promise<{ ok: boolean; message: string }> => dataHubApi.retryImportJob(id),
  cancelImportJob: (id: string): Promise<{ ok: boolean; message: string }> => dataHubApi.cancelImportJob(id),
  getSettings: (): Promise<DataHubSettings> => dataHubApi.settings(),
  synchronize: (entityType: string, entityId: string, entityName: string) => dataHubApi.synchronize(entityType, entityId, entityName),
  syncMasterData: (): Promise<MasterDataCollection> => dataHubApi.syncMasterData(),
  syncLookup: (entityType: SyncEntityType): Promise<MasterDataLookupResponse> => dataHubApi.syncLookup(entityType),
  syncStatus: (): Promise<SyncStatusEntry[]> => dataHubApi.syncStatus(),
  syncEntity: (entityType: SyncEntityType, data: Record<string, unknown>): Promise<SyncResult> => dataHubApi.syncEntity(entityType, data),
  // -------------------------------------------------------------------
  // Sprint 4.3 — Synchronization Engine
  // -------------------------------------------------------------------
  syncRun: (input: { entityType?: SyncEngineEntityType; entityId?: string; jobType?: SyncJobType } = {}): Promise<SyncRunResult> =>
    dataHubApi.syncRun(input),
  syncEngineStatus: (): Promise<SyncStatusEntryV2[]> => dataHubApi.syncEngineStatus(),
  syncLogs: (limit?: number): Promise<SyncActivityLogEntry[]> => dataHubApi.syncLogs(limit),
  syncRetry: (jobId: string): Promise<SyncRunResult> => dataHubApi.syncRetry(jobId),
  syncDocumentResolve: (input: { fileName?: string; fileUrl?: string; title?: string; fileHash?: string }) =>
    dataHubApi.syncDocumentResolve(input),
  syncDocumentLink: (input: { documentId: string; entityType: string; entityId?: string }) =>
    dataHubApi.syncDocumentLink(input),
  syncDocumentLinks: (entityType: string, entityId?: string) =>
    dataHubApi.syncDocumentLinks(entityType, entityId),
};