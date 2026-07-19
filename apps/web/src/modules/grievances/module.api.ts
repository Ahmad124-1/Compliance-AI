import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { GRIEVANCE_ENDPOINTS } from './module.constants.js';
import type {
  Grievance,
  GrievanceAttachment,
  GrievanceCategory,
  ComplaintSource,
  GrievanceChannel,
  Language,
  WorkerPortalConfiguration,
  QrPortal,
  GrievanceSubmitInput,
  GrievanceTrackInput,
  CategoryCreateInput,
  PortalConfigInput,
  QrPortalInput,
} from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());
const publicHttp = createHttpClient();

export const grievancesApi = {
  submit: (dto: GrievanceSubmitInput) =>
    publicHttp<{ trackingNumber: string; trackingPIN: string; id: string }>(GRIEVANCE_ENDPOINTS.publicComplaints, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  track: (dto: GrievanceTrackInput) =>
    publicHttp<{ found: boolean; trackingNumber?: string; status?: string; priority?: string; category?: string; createdAt?: string; updatedAt?: string }>(GRIEVANCE_ENDPOINTS.publicTrack, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getCategories: (organizationId?: string) => {
    const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    return publicHttp<GrievanceCategory[]>(`${GRIEVANCE_ENDPOINTS.publicCategories}${qs}`);
  },

  getLanguages: () => publicHttp<Language[]>(GRIEVANCE_ENDPOINTS.publicLanguages),

  getSources: () => publicHttp<ComplaintSource[]>(GRIEVANCE_ENDPOINTS.publicSources),

  getChannels: () => publicHttp<GrievanceChannel[]>(GRIEVANCE_ENDPOINTS.publicChannels),

  list: (params: { status?: string; category?: string; source?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.category) qs.set('category', params.category);
    if (params.source) qs.set('source', params.source);
    const q = qs.toString();
    return http<Grievance[]>(`${GRIEVANCE_ENDPOINTS.adminGrievances}${q ? `?${q}` : ''}`);
  },

  get: (id: string) => http<Grievance>(GRIEVANCE_ENDPOINTS.adminGrievance(id)),

  update: (id: string, patch: { status?: string; priority?: string; severity?: string | null }) =>
    http<Grievance>(GRIEVANCE_ENDPOINTS.adminGrievance(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  getAttachments: (id: string) => http<GrievanceAttachment[]>(GRIEVANCE_ENDPOINTS.adminAttachments(id)),

  createCategory: (dto: CategoryCreateInput) =>
    http<GrievanceCategory>(GRIEVANCE_ENDPOINTS.adminCreateCategory, { method: 'POST', body: JSON.stringify(dto) }),

  listCategories: () => http<GrievanceCategory[]>(GRIEVANCE_ENDPOINTS.adminCategories),

  getPortalConfig: () => http<WorkerPortalConfiguration>(GRIEVANCE_ENDPOINTS.adminPortalConfig),

  upsertPortalConfig: (dto: PortalConfigInput) =>
    http<WorkerPortalConfiguration>(GRIEVANCE_ENDPOINTS.adminPortalConfig, { method: 'PATCH', body: JSON.stringify(dto) }),

  createQrPortal: (dto: QrPortalInput) =>
    http<QrPortal>(GRIEVANCE_ENDPOINTS.adminQrPortals, { method: 'POST', body: JSON.stringify(dto) }),

  listQrPortals: () => http<QrPortal[]>(GRIEVANCE_ENDPOINTS.adminQrPortals),
};
