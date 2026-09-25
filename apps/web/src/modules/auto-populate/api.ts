import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());
const BASE = '/api/v1/auto-populate';

export interface AutoFillResult {
  facilityId: string | null;
  facilityName: string | null;
  supplierIds: string[];
  projectId: string | null;
  projectName: string | null;
  kpiId: string | null;
  kpiName: string | null;
  reportingPeriodId: string | null;
  reportingPeriodName: string | null;
  documentIds: string[];
  programId: string | null;
  programName: string | null;
  goalId: string | null;
  goalName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  siteId: string | null;
  siteName: string | null;
  userId: string | null;
  userName: string | null;
}

export interface CalculationsResult {
  projects: Array<{ id: string; name: string; progressPct: number; completedMilestones: number; totalMilestones: number }>;
  goals: Array<{ id: string; name: string; progressPct: number; currentValue: number; targetValue: number; baseline: number | null }>;
  targets: Array<{ id: string; name: string; progressPct: number; currentValue: number; targetValue: number }>;
  kpis: Array<{ id: string; name: string; status: string; latestValue: number | null; targetValue: number | null; warningThreshold: number | null; criticalThreshold: number | null }>;
  reductions: Array<{ id: string; name: string; reductionTco2e: number }>;
  emissions: Array<{ scope: string; totalTco2e: number; recordCount: number }>;
  suppliers: Array<{ id: string; name: string; contributionTco2e: number; contributionPct: number }>;
  compliance: { totalRequirements: number; compliant: number; nonCompliant: number; compliancePct: number };
  esg: { environment: number; social: number; governance: number; overall: number };
  evidence: Array<{ entityType: string; count: number }>;
}

export interface ReportSnapshotResult extends CalculationsResult {
  generatedAt: string;
  reportId: string | null;
  reportName: string | null;
  reportStatus: string | null;
  reportCompletionPct: number;
  totals: Record<string, number>;
}

const qs = (params: Record<string, string> = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : '';
};

export const autoPopulateApi = {
  fill: (params: Record<string, string> = {}) => http<AutoFillResult>(`${BASE}${qs(params)}`),
  calculations: (params: Record<string, string> = {}) => http<CalculationsResult>(`${BASE}/calculations${qs(params)}`),
  reportSnapshot: (reportId?: string) => http<ReportSnapshotResult>(`${BASE}/reports/snapshot${qs(reportId ? { reportId } : {})}`),
  projectProgress: (projectId?: string) => http<Array<{ id: string; name: string; progressPct: number; completedMilestones: number; totalMilestones: number }>>(`${BASE}/project-progress${qs(projectId ? { projectId } : {})}`),
  goalProgress: (programId?: string) => http<Array<{ id: string; name: string; progressPct: number; currentValue: number; targetValue: number; baseline: number | null }>>(`${BASE}/goal-progress${qs(programId ? { programId } : {})}`),
  kpiStatuses: (programId?: string) => http<Array<{ id: string; name: string; status: string; latestValue: number | null; targetValue: number | null }>>(`${BASE}/kpi-statuses${qs(programId ? { programId } : {})}`),
  emissionTotals: (facilityId?: string) => http<Array<{ scope: string; totalTco2e: number; recordCount: number }>>(`${BASE}/emission-totals${qs(facilityId ? { facilityId } : {})}`),
  reportCompletion: () => http<Array<{ id: string; name: string; completionPct: number; sectionsComplete: number; totalSections: number; status: string }>>(`${BASE}/report-completion`),
};