import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { REPORT_ENDPOINTS } from './constants.js';
import type { ReportFormat, ReportResult, ReportTemplate, ReportType } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const reportsApi = {
  listTemplates: () => http<ReportTemplate[]>(REPORT_ENDPOINTS.templates),
  createTemplate: (input: { name: string; type: ReportType; format: ReportFormat; description?: string; isDefault?: boolean }) =>
    http<ReportTemplate>(REPORT_ENDPOINTS.templates, { method: 'POST', body: JSON.stringify(input) }),
  generate: (input: { type: ReportType; format: ReportFormat; title?: string; filters?: Record<string, unknown>; includeCharts?: boolean }) =>
    http<ReportResult>(REPORT_ENDPOINTS.generate, { method: 'POST', body: JSON.stringify(input) }),
  download: (id: string, format: ReportFormat) => http<{ payload: unknown }>(`${REPORT_ENDPOINTS.download(id)}?format=${format}`),
};
