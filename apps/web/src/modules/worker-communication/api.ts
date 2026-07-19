import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { WORKER_COMM_ENDPOINTS } from './constants.js';
import type { StatusUpdate, TimelineEntry } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const workerCommApi = {
  listStatusUpdates: (caseId?: string) => {
    const q = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    return http<StatusUpdate[]>(`${WORKER_COMM_ENDPOINTS.statusUpdates}${q}`);
  },

  getStatusUpdate: (id: string) => http<StatusUpdate>(WORKER_COMM_ENDPOINTS.statusUpdate(id)),

  sendStatusUpdate: (dto: Partial<StatusUpdate>) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.statusUpdates, { method: 'POST', body: JSON.stringify(dto) }),

  getTimeline: (caseId: string) => http<TimelineEntry[]>(WORKER_COMM_ENDPOINTS.timeline(caseId)),

  sendPublicMessage: (caseId: string, message: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.publicMessage(caseId), { method: 'POST', body: JSON.stringify({ message }) }),

  requestInfo: (caseId: string, message: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.requestInfo(caseId), { method: 'POST', body: JSON.stringify({ message }) }),

  acknowledge: (caseId: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.acknowledge(caseId), { method: 'POST' }),

  sendResolutionNotice: (caseId: string, message: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.resolutionNotice(caseId), { method: 'POST', body: JSON.stringify({ message }) }),

  close: (caseId: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.close(caseId), { method: 'POST' }),

  requestFeedback: (caseId: string) =>
    http<StatusUpdate>(WORKER_COMM_ENDPOINTS.requestFeedback(caseId), { method: 'POST' }),
};
