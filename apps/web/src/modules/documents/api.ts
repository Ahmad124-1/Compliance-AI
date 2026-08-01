import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { DOCUMENT_ENDPOINTS } from './constants.js';
import type { DocumentRecord, DocumentAnalysis } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const documentsApi = {
  list: () => http<DocumentRecord[]>(DOCUMENT_ENDPOINTS.list),
  get: (id: string) => http<DocumentRecord>(DOCUMENT_ENDPOINTS.get(id)),
  upload: (input: { filename: string; contentType: string; sizeBytes: number }) =>
    http<DocumentRecord>(DOCUMENT_ENDPOINTS.upload, { method: 'POST', body: JSON.stringify(input) }),
  process: (id: string) => http<DocumentRecord>(DOCUMENT_ENDPOINTS.process(id), { method: 'POST' }),
  analyze: (id: string, action: string) =>
    http<DocumentAnalysis>(DOCUMENT_ENDPOINTS.analyze(id), { method: 'POST', body: JSON.stringify({ action }) }),
};

