import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { DATA_HUB_ENDPOINTS, SYNC_ENDPOINTS, SYNC_ENGINE_ENDPOINTS } from './constants.js';
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

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const dataHubApi = {
  dashboard: () => http<DataHubDashboardSummary>(DATA_HUB_ENDPOINTS.dashboard),
  masterData: () => http<MasterDataCollection>(DATA_HUB_ENDPOINTS.masterData),
  syncMasterData: () => http<MasterDataCollection>(SYNC_ENDPOINTS.masterData),
  syncLookup: (entityType: SyncEntityType) =>
    http<MasterDataLookupResponse>(SYNC_ENDPOINTS.lookup(entityType)),
  syncStatus: () => http<SyncStatusEntry[]>(SYNC_ENDPOINTS.status),
  syncEntity: (entityType: SyncEntityType, data: Record<string, unknown>) =>
    http<SyncResult>(SYNC_ENDPOINTS.entity(entityType), { method: 'POST', body: JSON.stringify(data) }),
  statistics: () => http<Record<string, unknown>>(DATA_HUB_ENDPOINTS.statistics),
  queue: () => http<DataHubQueue>(DATA_HUB_ENDPOINTS.queue),
  activity: (limit = 100) => http<DataHubActivityEntry[]>(`${DATA_HUB_ENDPOINTS.activity}?limit=${limit}`),
  documents: (category?: string) =>
    http<HubDocument[]>(category ? `${DATA_HUB_ENDPOINTS.documents}?category=${encodeURIComponent(category)}` : DATA_HUB_ENDPOINTS.documents),
  createDocument: (input: { title: string; category: string; fileUrl: string; fileName?: string; fileType?: string; fileSize?: number; metadata?: Record<string, unknown>; linkTo?: Array<{ entityType?: string; entityId?: string; linkType?: string }> }) =>
    http<HubDocument>(DATA_HUB_ENDPOINTS.documents, { method: 'POST', body: JSON.stringify(input) }),
  validation: (status?: string, entityType?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (entityType) params.set('entityType', entityType);
    const qs = params.toString();
    return http<ValidationQueueItem[]>(qs ? `${DATA_HUB_ENDPOINTS.validation}?${qs}` : DATA_HUB_ENDPOINTS.validation);
  },
  reviewValidation: (id: string, action: string, note?: string, data?: Record<string, unknown>) =>
    http<ValidationQueueItem>(`${DATA_HUB_ENDPOINTS.validation}/${id}`, { method: 'PATCH', body: JSON.stringify({ action, note, data }) }),
  createImport: (input: { importType: string; entityType: string; fileName: string; fileUrl?: string; fileSize?: number; records?: Array<Record<string, unknown>>; metadata?: Record<string, unknown> }) =>
    http<ImportJob>(DATA_HUB_ENDPOINTS.import, { method: 'POST', body: JSON.stringify(input) }),
  previewImport: (importJobId: string) =>
    http<ImportPreview>(DATA_HUB_ENDPOINTS.importPreview, { method: 'POST', body: JSON.stringify({ importJobId }) }),
  commitImport: (importJobId: string, entityType?: string) =>
    http<ImportJob>(DATA_HUB_ENDPOINTS.importCommit, { method: 'POST', body: JSON.stringify({ importJobId, entityType }) }),
  validateImport: (importJobId: string, entityType: string, records: Array<Record<string, unknown>>) =>
    http<ValidationReport>(DATA_HUB_ENDPOINTS.importValidate, { method: 'POST', body: JSON.stringify({ importJobId, entityType, records }) }),
  importJobs: (status?: string) =>
    http<ImportJob[]>(status ? `${DATA_HUB_ENDPOINTS.importJobs}?status=${encodeURIComponent(status)}` : DATA_HUB_ENDPOINTS.importJobs),
  importJobDetail: (id: string) =>
    http<ImportJobDetail>(DATA_HUB_ENDPOINTS.importJob(id)),
  retryImportJob: (id: string) =>
    http<{ ok: boolean; message: string }>(DATA_HUB_ENDPOINTS.importJobRetry(id), { method: 'POST', body: JSON.stringify({}) }),
  cancelImportJob: (id: string) =>
    http<{ ok: boolean; message: string }>(DATA_HUB_ENDPOINTS.importJob(id), { method: 'DELETE' }),
  settings: () => http<DataHubSettings>(DATA_HUB_ENDPOINTS.settings),
  synchronize: (entityType: string, entityId: string, entityName: string) =>
    http<{ entityType: string; entityId: string; propagatedTo: string[] }>(DATA_HUB_ENDPOINTS.synchronize, { method: 'POST', body: JSON.stringify({ entityType, entityId, entityName }) }),
  // -------------------------------------------------------------------
  // Sprint 4.3 — Synchronization Engine
  // -------------------------------------------------------------------
  syncRun: (input: { entityType?: SyncEngineEntityType; entityId?: string; jobType?: SyncJobType } = {}) =>
    http<SyncRunResult>(SYNC_ENGINE_ENDPOINTS.run, { method: 'POST', body: JSON.stringify(input) }),
  syncEngineStatus: () =>
    http<SyncStatusEntryV2[]>(SYNC_ENGINE_ENDPOINTS.status),
  syncLogs: (limit = 100) =>
    http<SyncActivityLogEntry[]>(`${SYNC_ENGINE_ENDPOINTS.logs}?limit=${limit}`),
  syncRetry: (jobId: string) =>
    http<SyncRunResult>(SYNC_ENGINE_ENDPOINTS.retry, { method: 'POST', body: JSON.stringify({ jobId }) }),
  syncDocumentResolve: (input: { fileName?: string; fileUrl?: string; title?: string; fileHash?: string }) =>
    http<{ documentId: string; existing: boolean }>(SYNC_ENGINE_ENDPOINTS.documentResolve, { method: 'POST', body: JSON.stringify(input) }),
  syncDocumentLink: (input: { documentId: string; entityType: string; entityId?: string }) =>
    http<{ linkId: string; linked: boolean }>(SYNC_ENGINE_ENDPOINTS.documentLink, { method: 'POST', body: JSON.stringify(input) }),
  syncDocumentLinks: (entityType: string, entityId?: string) =>
    http<Array<Record<string, unknown>>>(SYNC_ENGINE_ENDPOINTS.documents(entityType, entityId)),
};