import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { WORKER_ENDPOINTS } from './constants.js';
import type { WorkerProfile, WorkerDirectoryEntry, Announcement, WorkerTask, WorkerDocument, WorkerForm, WorkerLearning } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const workerPlatformApi = {
  getProfile: () => http<WorkerProfile>(WORKER_ENDPOINTS.profile),

  updateProfile: (data: Record<string, unknown>) => http<WorkerProfile>(WORKER_ENDPOINTS.profile, { method: 'PATCH', body: JSON.stringify(data) }),

  searchDirectory: (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return http<{ workers: WorkerDirectoryEntry[]; total: number }>(`${WORKER_ENDPOINTS.directory}?${qs.toString()}`);
  },

  listAnnouncements: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return http<{ announcements: Announcement[]; total: number }>(`${WORKER_ENDPOINTS.announcements}${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getAnnouncement: (id: string) => http<Announcement>(`${WORKER_ENDPOINTS.announcements}/${id}`),

  createAnnouncement: (data: Record<string, unknown>) => http<Announcement>(WORKER_ENDPOINTS.announcements, { method: 'POST', body: JSON.stringify(data) }),

  updateAnnouncement: (id: string, data: Record<string, unknown>) => http<Announcement>(`${WORKER_ENDPOINTS.announcements}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  markAnnouncementRead: (id: string) => http<{ success: boolean }>(`${WORKER_ENDPOINTS.announcements}/${id}/read`, { method: 'POST' }),

  acknowledgeAnnouncement: (id: string) => http<{ success: boolean }>(`${WORKER_ENDPOINTS.announcements}/${id}/acknowledge`, { method: 'POST' }),

  listTasks: () => http<WorkerTask[]>(WORKER_ENDPOINTS.tasks),

  getTask: (id: string) => http<WorkerTask>(`${WORKER_ENDPOINTS.tasks}/${id}`),

  createTask: (data: Record<string, unknown>) => http<WorkerTask>(WORKER_ENDPOINTS.tasks, { method: 'POST', body: JSON.stringify(data) }),

  completeTask: (id: string) => http<WorkerTask>(`${WORKER_ENDPOINTS.tasks}/${id}/complete`, { method: 'POST' }),

  listDocuments: () => http<{ documents: WorkerDocument[]; total: number }>(WORKER_ENDPOINTS.documents),

  getDocument: (id: string) => http<WorkerDocument>(`${WORKER_ENDPOINTS.documents}/${id}`),

  createDocument: (data: Record<string, unknown>) => http<WorkerDocument>(WORKER_ENDPOINTS.documents, { method: 'POST', body: JSON.stringify(data) }),

  downloadDocument: (id: string) => http<WorkerDocument>(`${WORKER_ENDPOINTS.documents}/${id}/download`, { method: 'POST' }),

  listForms: () => http<WorkerForm[]>(WORKER_ENDPOINTS.forms),

  getForm: (id: string) => http<WorkerForm>(`${WORKER_ENDPOINTS.forms}/${id}`),

  submitForm: (data: Record<string, unknown>) => http<WorkerForm>(WORKER_ENDPOINTS.forms, { method: 'POST', body: JSON.stringify(data) }),

  listLearning: () => http<WorkerLearning[]>(WORKER_ENDPOINTS.learning),

  getLearning: (id: string) => http<WorkerLearning>(`${WORKER_ENDPOINTS.learning}/${id}`),

  enrollLearning: (data: Record<string, unknown>) => http<WorkerLearning>(WORKER_ENDPOINTS.learning, { method: 'POST', body: JSON.stringify(data) }),

  updateLearningProgress: (id: string, data: Record<string, unknown>) => http<WorkerLearning>(`${WORKER_ENDPOINTS.learning}/${id}/progress`, { method: 'POST', body: JSON.stringify(data) }),
};
