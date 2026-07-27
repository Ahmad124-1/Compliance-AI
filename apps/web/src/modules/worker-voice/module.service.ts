import { workerVoiceApi } from './module.api.js';
import type {
  ReportConcernInput,
  EmergencyReportInput,
  QRGenerateInput,
} from './module.validation.js';

export const workerVoiceService = {
  getDashboard: () => workerVoiceApi.getDashboard(),

  reportConcern: (dto: ReportConcernInput) => workerVoiceApi.reportConcern(dto),

  getMyCases: () => workerVoiceApi.getMyCases(),

  trackCase: (caseId: string) => workerVoiceApi.trackCase(caseId),

  getHotlineContacts: () => workerVoiceApi.getHotlineContacts(),

  submitEmergencyReport: (dto: EmergencyReportInput) => workerVoiceApi.submitEmergencyReport(dto),

  getCaseEvidence: (caseId: string) => workerVoiceApi.getCaseEvidence(caseId),

  addEvidenceToCase: (caseId: string, dto: Record<string, unknown>) => workerVoiceApi.addEvidenceToCase(caseId, dto),

  listQRPortals: () => workerVoiceApi.listQRPortals(),

  generateQRPortal: (dto: QRGenerateInput) => workerVoiceApi.generateQRPortal(dto),
};
