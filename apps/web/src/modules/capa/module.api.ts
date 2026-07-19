import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { CAPA_ENDPOINTS } from './module.constants.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const capaApi = {
  listFindings: () => http(CAPA_ENDPOINTS.findings),
  createFinding: (dto: Record<string, unknown>) => http(CAPA_ENDPOINTS.findings, { method: 'POST', body: JSON.stringify(dto) }),
  listNonConformities: () => http(CAPA_ENDPOINTS.nonConformities),
  createNonConformity: (dto: Record<string, unknown>) => http(CAPA_ENDPOINTS.nonConformities, { method: 'POST', body: JSON.stringify(dto) }),
  listCAPAs: () => http(CAPA_ENDPOINTS.capas),
  createCAPA: (dto: Record<string, unknown>) => http(CAPA_ENDPOINTS.capas, { method: 'POST', body: JSON.stringify(dto) }),
};
