import { documentsApi } from './api.js';

export const documentsService = {
  listDocuments: () => documentsApi.list(),
  getDocument: (id: string) => documentsApi.get(id),
  uploadDocument: (filename: string, contentType: string, sizeBytes: number) =>
    documentsApi.upload({ filename, contentType, sizeBytes }),
  processDocument: (id: string) => documentsApi.process(id),
  analyzeDocument: (id: string, action: string) => documentsApi.analyze(id, action),
};

