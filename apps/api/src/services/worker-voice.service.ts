import { caseService } from './case.service.js';
import { qrService } from './qr.service.js';
import { notificationService } from './notification.service.js';
import { audit } from '../core/audit.js';
import { query } from '../db/pool.js';

export interface WorkerVoiceDashboardStats {
  organizationId: string;
  openCases: number;
  resolvedCases: number;
  pendingCases: number;
  anonymousCases: number;
  avgResponseTime: number | null;
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  recentUpdates: Array<{
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
}

export interface ReportConcernInput {
  organizationId: string;
  title: string;
  description: string;
  category: string;
  location?: string | null;
  department?: string | null;
  priority?: string;
  source?: string;
  anonymous?: boolean;
  language?: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  metadata?: Record<string, unknown>;
}

export interface QRPortalGenerateInput {
  organizationId: string;
  name: string;
  qrType: string;
  siteId?: string | null;
  departmentId?: string | null;
  portalUrl: string;
}

export const workerVoiceService = {
  async getDashboard(orgId: string): Promise<WorkerVoiceDashboardStats> {
    const stats = await caseService.getCaseStats(orgId, {});
    const statuses = stats.byStatus as Record<string, number>;
    const openCases = (statuses['open'] || 0) + (statuses['under_investigation'] || 0);
    const resolvedCases = statuses['resolved'] || 0;
    const pendingCases = statuses['pending_review'] || 0;

    const { rows: anonRows } = await query(
      'SELECT COUNT(*) AS count FROM cases WHERE organization_id = $1 AND reporter_anonymous = TRUE AND is_deleted = FALSE',
      [orgId]
    );
    const anonymousCases = parseInt(anonRows[0]?.count || '0', 10);

    const { rows: timeRows } = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) AS avg_minutes FROM cases WHERE organization_id = $1 AND status = 'resolved' AND is_deleted = FALSE AND updated_at IS NOT NULL`,
      [orgId]
    );
    const avgResponseTime = timeRows[0]?.avg_minutes ? parseFloat(timeRows[0].avg_minutes) : null;

    const { rows: categoryRows } = await query(
      `SELECT category, COUNT(*) AS count FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY category ORDER BY count DESC`,
      [orgId]
    );
    const categoryBreakdown: Record<string, number> = {};
    for (const r of categoryRows) categoryBreakdown[r.category] = parseInt(r.count, 10);

    const { rows: sourceRows } = await query(
      `SELECT source, COUNT(*) AS count FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY source ORDER BY count DESC`,
      [orgId]
    );
    const sourceBreakdown: Record<string, number> = {};
    for (const r of sourceRows) sourceBreakdown[r.source] = parseInt(r.count, 10);

    const recentResult = await caseService.listCases(orgId, { limit: 5 });
    const recentUpdates = (recentResult as any).cases?.map((c: any) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      status: c.status,
      updatedAt: c.updatedAt,
    }));

    return {
      organizationId: orgId,
      openCases,
      resolvedCases,
      pendingCases,
      anonymousCases,
      avgResponseTime,
      categoryBreakdown,
      sourceBreakdown,
      recentUpdates,
    };
  },

  async reportConcern(input: ReportConcernInput, actorId?: string) {
    const case_ = await caseService.createCase({
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      category: input.category,
      source: input.source || 'worker-voice',
      priority: input.priority || 'medium',
      reporterName: input.reporterName ?? null,
      reporterEmail: input.reporterEmail ?? null,
      reporterPhone: input.reporterPhone ?? null,
      reporterAnonymous: input.anonymous ?? true,
      metadata: {
        language: input.language || 'en',
        location: input.location || null,
        department: input.department || null,
        ...(input.metadata || {}),
      },
    }, actorId);

    await notificationService.createNotification({
      organizationId: input.organizationId,
      userId: actorId || '',
      type: 'status_update',
      channel: 'in_app',
      title: 'New Worker Voice Concern',
      body: `Concern reported: ${input.title}`,
      data: { caseId: case_.id, caseNumber: case_.caseNumber },
    });

    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'worker_voice.report', entity: 'case', entityId: case_.id });

    return case_;
  },

  async getMyCases(orgId: string, userId: string) {
    return caseService.listCases(orgId, { assignedTo: [userId] });
  },

  async generateQRPortal(input: QRPortalGenerateInput, actorId?: string) {
    const qr = await qrService.createQrCode({
      organizationId: input.organizationId,
      name: input.name,
      type: input.qrType,
      url: input.portalUrl,
      siteId: input.siteId ?? null,
      departmentId: input.departmentId ?? null,
      isActive: true,
    }, actorId);
    return qr;
  },
};
