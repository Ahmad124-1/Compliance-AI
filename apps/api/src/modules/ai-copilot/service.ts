import { aiConfigRepo } from '../ai/engine/config.repo.js';
import { createRegistry, resolveCredentials } from '../ai/engine/registry.js';
import { tokenLedgerRepo } from '../ai/engine/token-ledger.repo.js';
import { aiJobRepo } from '../ai/engine/jobs.queue.js';
import { vectorService } from '../ai/vector/service.js';
import { knowledgeService } from '../ai/knowledge/service.js';

export interface HealthStatus {
  configured: boolean;
  provider: string;
  model: string;
  status: 'healthy' | 'degraded' | 'disabled';
}

export interface OverviewStats {
  provider: string;
  model: string;
  tokenUsageToday: { totalTokens: number; completionTokens: number; embeddingTokens: number };
  aiRequests: number;
  costUsd: number;
  recentConversations: unknown[];
  pendingJobs: number;
  knowledgeBaseStatus: { totalEntries: number; indexedEntries: number };
  embeddingStatus: HealthStatus;
  vectorDbStatus: { totalVectors: number };
}

export const copilotService = {
  async getHealth(organizationId: string): Promise<{
    ai: HealthStatus;
    tokenLedger: { totalCostUsd: number; totalTokens: number; requestCount: number };
    jobs: { queued: number; running: number; failed: number };
    knowledge: { totalEntries: number };
    vector: { totalVectors: number };
  }> {
    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId });
    const provider = registry.chatProvider();

    const tokenSummary = await tokenLedgerRepo.summary(organizationId, 1);
    const jobStats = await aiJobRepo.stats(organizationId);
    const vectorCount = await vectorService.count(organizationId);
    const knowledgeEntries = await knowledgeService.listEntries({ organizationId });

    return {
      ai: {
        configured: provider.isConfigured(),
        provider: config.provider,
        model: config.model,
        status: provider.isConfigured() ? 'healthy' : 'disabled',
      },
      tokenLedger: {
        totalCostUsd: tokenSummary.totalCostUsd,
        totalTokens: tokenSummary.totalTokens,
        requestCount: tokenSummary.requestCount,
      },
      jobs: {
        queued: jobStats.queued,
        running: jobStats.running,
        failed: jobStats.failed,
      },
      knowledge: {
        totalEntries: knowledgeEntries.length,
      },
      vector: {
        totalVectors: vectorCount,
      },
    };
  },

  async getOverview(organizationId: string): Promise<OverviewStats> {
    const config = await aiConfigRepo.get(organizationId);

    const tokenSummary = await tokenLedgerRepo.summary(organizationId, 1);
    const jobStats = await aiJobRepo.stats(organizationId);
    const vectorCount = await vectorService.count(organizationId);
    const knowledgeEntries = await knowledgeService.listEntries({ organizationId });

    const recentLedger = await tokenLedgerRepo.recent(organizationId, 10);
    const recentConversations = recentLedger.map((entry) => ({
      id: entry.id,
      provider: entry.provider,
      model: entry.model,
      kind: entry.kind,
      totalTokens: entry.totalTokens,
      costUsd: entry.costUsd,
      createdAt: entry.createdAt,
    }));

    return {
      provider: config.provider,
      model: config.model,
      tokenUsageToday: {
        totalTokens: tokenSummary.totalTokens,
        completionTokens: tokenSummary.completionTokens,
        embeddingTokens: tokenSummary.embeddingTokens,
      },
      aiRequests: tokenSummary.requestCount,
      costUsd: tokenSummary.totalCostUsd,
      recentConversations,
      pendingJobs: jobStats.queued + jobStats.running + jobStats.retrying,
      knowledgeBaseStatus: {
        totalEntries: knowledgeEntries.length,
        indexedEntries: vectorCount,
      },
      embeddingStatus: {
        configured: false,
        provider: config.embeddingProvider,
        model: config.embeddingModel,
        status: 'disabled',
      },
      vectorDbStatus: {
        totalVectors: vectorCount,
      },
    };
  },
};
