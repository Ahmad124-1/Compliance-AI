import { NotFoundError } from '../core/errors.js';
import { caseRepo } from '../repositories/case.repo.js';
import { caseStatusHistoryRepo } from '../repositories/case-status-history.repo.js';
import { publicResponseRepo } from '../repositories/public-response.repo.js';
import { workerStatusUpdateRepo } from '../repositories/worker-status-update.repo.js';

export interface CaseTrackingResult {
  caseId: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  reporterAnonymous: boolean;
  timeline: Array<{
    id: string;
    activityType: string;
    description: string;
    createdAt: string;
  }>;
  publicResponses: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
  workerUpdates: Array<{
    id: string;
    updateType: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
}

export const caseTrackingService = {
  async trackCase(caseId: string): Promise<CaseTrackingResult> {
    const case_ = await caseRepo.findById(caseId);
    if (!case_) throw new NotFoundError('Case not found');

    const [timeline, publicResponses, workerUpdates] = await Promise.all([
      caseStatusHistoryRepo.listByCase(caseId),
      publicResponseRepo.findByCaseId(caseId),
      workerStatusUpdateRepo.findByCase(case_.organizationId, caseId),
    ]);

    return {
      caseId: case_.id,
      caseNumber: case_.caseNumber,
      title: case_.title,
      status: case_.status,
      priority: case_.priority,
      category: case_.category,
      reporterAnonymous: case_.reporterAnonymous,
      timeline: timeline.reverse().map((t) => ({
        id: t.id,
        activityType: t.newStatus || 'updated',
        description: t.reason || `Status changed to ${t.newStatus}`,
        createdAt: t.createdAt,
      })),
      publicResponses: publicResponses.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt,
      })),
      workerUpdates: workerUpdates.map((u) => ({
        id: u.id,
        updateType: u.updateType,
        title: u.title,
        message: u.message,
        createdAt: u.createdAt,
      })),
    };
  },
};
