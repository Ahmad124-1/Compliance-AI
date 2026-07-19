import { reportsApi } from './api.js';

export const reportsService = {
  listTemplates: () => reportsApi.listTemplates(),
  createTemplate: (input: { name: string; type: any; format: any; description?: string; isDefault?: boolean }) => reportsApi.createTemplate(input),
  generate: (input: { type: any; format: any; title?: string; filters?: Record<string, unknown>; includeCharts?: boolean }) => reportsApi.generate(input),
  download: (id: string, format: any) => reportsApi.download(id, format),
};
