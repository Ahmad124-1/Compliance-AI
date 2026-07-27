'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { workerVoiceService } from './module.service.js';
import type {
  ReportConcernInput,
  EmergencyReportInput,
  QRGenerateInput,
  EvidenceUploadInput,
} from './module.validation.js';

export function useWorkerVoiceDashboard() {
  return useQuery({
    queryKey: ['worker-voice', 'dashboard'],
    queryFn: () => workerVoiceService.getDashboard(),
  });
}

export function useReportConcern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReportConcernInput) => workerVoiceService.reportConcern(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-voice', 'dashboard'] }),
  });
}

export function useMyCases() {
  return useQuery({
    queryKey: ['worker-voice', 'my-cases'],
    queryFn: () => workerVoiceService.getMyCases(),
  });
}

export function useCaseTracking(caseId: string) {
  return useQuery({
    queryKey: ['worker-voice', 'track', caseId],
    queryFn: () => workerVoiceService.trackCase(caseId),
    enabled: !!caseId,
  });
}

export function useHotlineContacts() {
  return useQuery({
    queryKey: ['worker-voice', 'hotline'],
    queryFn: () => workerVoiceService.getHotlineContacts(),
  });
}

export function useEmergencyReport() {
  return useMutation({
    mutationFn: (dto: EmergencyReportInput) => workerVoiceService.submitEmergencyReport(dto),
  });
}

export function useCaseEvidence(caseId: string) {
  return useQuery({
    queryKey: ['worker-voice', 'evidence', caseId],
    queryFn: () => workerVoiceService.getCaseEvidence(caseId),
    enabled: !!caseId,
  });
}

export function useAddEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: EvidenceUploadInput }) => workerVoiceService.addEvidenceToCase(vars.caseId, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['worker-voice', 'evidence', v.caseId] }),
  });
}

export function useQRPortals() {
  return useQuery({
    queryKey: ['worker-voice', 'qr'],
    queryFn: () => workerVoiceService.listQRPortals(),
  });
}

export function useGenerateQRPortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: QRGenerateInput) => workerVoiceService.generateQRPortal(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-voice', 'qr'] }),
  });
}
