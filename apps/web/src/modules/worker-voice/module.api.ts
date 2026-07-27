import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import type {
  WorkerVoiceCase,
  CaseTrackingInfo,
  HotlineContact,
  EmergencyReport,
  EvidenceItem,
  QRCodeInfo,
  WorkerVoiceDashboard,
} from './module.types.js';
import type { ReportConcernInput } from './module.validation.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

const API_BASE = '/api/v1/worker-voice';

export const workerVoiceApi = {
  getDashboard: () => http<WorkerVoiceDashboard>(`${API_BASE}/dashboard`),

  reportConcern: (dto: ReportConcernInput) =>
    http<WorkerVoiceCase>(`${API_BASE}/report`, { method: 'POST', body: JSON.stringify(dto) }),

  getMyCases: () => http<WorkerVoiceCase[]>(`${API_BASE}/my-cases`),

  trackCase: (caseId: string) =>
    http<CaseTrackingInfo>(`${API_BASE}/cases/${encodeURIComponent(caseId)}/track`),

  getHotlineContacts: () => http<HotlineContact[]>(`${API_BASE}/hotline`),

  submitEmergencyReport: (dto: { emergencyType: string; description: string; location?: string | null; caseId?: string | null; reporterName?: string | null; reporterPhone?: string | null }) =>
    http<EmergencyReport>(`${API_BASE}/hotline/emergency`, { method: 'POST', body: JSON.stringify(dto) }),

  getCaseEvidence: (caseId: string) =>
    http<EvidenceItem[]>(`${API_BASE}/evidence/${encodeURIComponent(caseId)}`),

  addEvidenceToCase: (caseId: string, dto: Record<string, unknown>) =>
    http<EvidenceItem>(`${API_BASE}/evidence/${encodeURIComponent(caseId)}`, { method: 'POST', body: JSON.stringify(dto) }),

  listQRPortals: () => http<QRCodeInfo[]>(`${API_BASE}/qr`),

  generateQRPortal: (dto: { name: string; qrType: string; siteId?: string | null; departmentId?: string | null; portalUrl: string }) =>
    http<QRCodeInfo>(`${API_BASE}/qr/generate`, { method: 'POST', body: JSON.stringify(dto) }),
};
