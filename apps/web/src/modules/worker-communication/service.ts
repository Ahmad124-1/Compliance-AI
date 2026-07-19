import { workerCommApi } from './api.js';
import type { StatusUpdate } from './types.js';

export const workerCommService = {
  listStatusUpdates: (caseId?: string) => workerCommApi.listStatusUpdates(caseId),
  getStatusUpdate: (id: string) => workerCommApi.getStatusUpdate(id),
  sendStatusUpdate: (dto: Partial<StatusUpdate>) => workerCommApi.sendStatusUpdate(dto),
  getTimeline: (caseId: string) => workerCommApi.getTimeline(caseId),
  sendPublicMessage: (caseId: string, message: string) => workerCommApi.sendPublicMessage(caseId, message),
  requestInfo: (caseId: string, message: string) => workerCommApi.requestInfo(caseId, message),
  acknowledge: (caseId: string) => workerCommApi.acknowledge(caseId),
  sendResolutionNotice: (caseId: string, message: string) => workerCommApi.sendResolutionNotice(caseId, message),
  close: (caseId: string) => workerCommApi.close(caseId),
  requestFeedback: (caseId: string) => workerCommApi.requestFeedback(caseId),
};
