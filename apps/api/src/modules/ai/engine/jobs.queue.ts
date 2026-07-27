/**
 * Background AI job queue.
 *
 * A lightweight but production-ready queue backed by the `ai_jobs` table. A
 * single in-process worker (`startWorker`) polls for `queued` jobs ordered by
 * priority + scheduled time, executes them, and records progress, attempts and
 * outcomes. Jobs cover embedding/indexing, summarization, analysis, generation,
 * RAG and translation. The worker is safe to run as a singleton; concurrent
 * runners use a `pg_advisory_lock` so it also works across multiple API nodes.
 */
import { query } from '../../../db/pool.js';
import { vectorService } from '../vector/service.js';
import { ragService } from '../rag/pipeline.js';
import { aiConfigRepo } from '../engine/config.repo.js';
import { createRegistry, resolveCredentials } from '../engine/registry.js';
import { AiDisabledError } from '../engine/providers/null.provider.js';
import type { ChatMessage, CompletionOptions } from '../engine/types.js';

export type JobType = 'embed' | 'summarize' | 'analyze' | 'generate' | 'rag' | 'translate' | 'index_kb';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export interface JobRecord {
  id: string;
  organizationId: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  progress: number;
  provider: string | null;
  model: string | null;
  createdBy: string | null;
  scheduledFor: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(r: any): JobRecord {
  return {
    id: r.id,
    organizationId: r.organization_id,
    type: r.type,
    status: r.status,
    priority: r.priority,
    payload: r.payload ?? {},
    result: r.result,
    error: r.error,
    attempts: r.attempts,
    maxAttempts: r.max_attempts,
    progress: r.progress,
    provider: r.provider,
    model: r.model,
    createdBy: r.created_by,
    scheduledFor: r.scheduled_for,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface EnqueueInput {
  organizationId: string;
  type: JobType;
  payload?: Record<string, unknown>;
  priority?: number;
  createdBy?: string | null;
  scheduledFor?: Date;
  maxAttempts?: number;
}

export const aiJobRepo = {
  async enqueue(input: EnqueueInput): Promise<JobRecord> {
    const { rows } = await query<any>(
      `INSERT INTO ai_jobs (organization_id, type, payload, priority, created_by, scheduled_for, max_attempts)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        input.organizationId,
        input.type,
        JSON.stringify(input.payload ?? {}),
        input.priority ?? 5,
        input.createdBy ?? null,
        input.scheduledFor ?? new Date(),
        input.maxAttempts ?? 3,
      ],
    );
    return mapRow(rows[0]);
  },

  async claim(): Promise<JobRecord | null> {
    // Advisory lock prevents two nodes from grabbing the same job.
    const { rows: lock } = await query<any>(`SELECT pg_try_advisory_xact_lock(914827) AS ok`);
    if (!lock[0]?.ok) return null;
    const { rows } = await query<any>(
      `UPDATE ai_jobs SET status = 'running', started_at = now(), attempts = attempts + 1
       WHERE id = (
         SELECT id FROM ai_jobs
         WHERE status = 'queued' AND scheduled_for <= now()
         ORDER BY priority ASC, scheduled_for ASC
         LIMIT 1 FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async complete(id: string, result: Record<string, unknown>, provider?: string | null, model?: string | null): Promise<void> {
    await query(
      `UPDATE ai_jobs SET status='completed', result=$2, progress=100, finished_at=now(), provider=$3, model=$4, error=NULL WHERE id=$1`,
      [id, JSON.stringify(result), provider ?? null, model ?? null],
    );
  },

  async fail(id: string, error: string, willRetry: boolean): Promise<void> {
    await query(
      `UPDATE ai_jobs SET status=$2, error=$3, finished_at = CASE WHEN $2='failed' THEN now() ELSE NULL END WHERE id=$1`,
      [id, willRetry ? 'retrying' : 'failed', error],
    );
    if (willRetry) {
      await query(`UPDATE ai_jobs SET status='queued', scheduled_for=now() + (attempts||' seconds')::interval WHERE id=$1`, [id]);
    }
  },

  async setProgress(id: string, progress: number): Promise<void> {
    await query(`UPDATE ai_jobs SET progress=$2 WHERE id=$1`, [id, progress]);
  },

  async cancel(id: string): Promise<void> {
    await query(`UPDATE ai_jobs SET status='cancelled', finished_at=now() WHERE id=$1 AND status IN ('queued','running','retrying')`, [id]);
  },

  async list(organizationId: string, status?: JobStatus, limit = 50): Promise<JobRecord[]> {
    const params: unknown[] = [organizationId];
    let i = 2;
    let where = 'organization_id = $1';
    if (status) { where += ` AND status = $${i++}`; params.push(status); }
    params.push(limit);
    const { rows } = await query<any>(`SELECT * FROM ai_jobs WHERE ${where} ORDER BY created_at DESC LIMIT $${i}`, params);
    return rows.map(mapRow);
  },

  async stats(organizationId: string): Promise<Record<JobStatus, number>> {
    const { rows } = await query<any>(
      `SELECT status, COUNT(*)::int AS c FROM ai_jobs WHERE organization_id = $1 GROUP BY status`,
      [organizationId],
    );
    const out: Record<JobStatus, number> = { queued: 0, running: 0, completed: 0, failed: 0, retrying: 0, cancelled: 0 };
    for (const r of rows) out[r.status as JobStatus] = r.c;
    return out;
  },
};

/** Execute a single job by type. Returns a result object. */
async function executeJob(job: JobRecord): Promise<{ result: Record<string, unknown>; provider?: string | null; model?: string | null }> {
  switch (job.type) {
    case 'embed':
    case 'index_kb': {
      if (job.type === 'index_kb') {
        const count = await vectorService.indexKnowledgeBase(job.organizationId);
        return { result: { indexed: count } };
      }
      const entryId = job.payload.entryId as string;
      await vectorService.indexKnowledgeEntry(entryId, job.organizationId);
      return { result: { entryId } };
    }
    case 'summarize':
    case 'analyze':
    case 'generate':
    case 'translate': {
      const config = await aiConfigRepo.get(job.organizationId);
      const registry = createRegistry(config, { ...resolveCredentials(), organizationId: job.organizationId, userId: job.createdBy, jobId: job.id });
      if (config.provider === 'null') throw new AiDisabledError();
      const messages: ChatMessage[] = (job.payload.messages as ChatMessage[]) ?? [{ role: 'user', content: String(job.payload.text ?? '') }];
      const opts: CompletionOptions = {
        organizationId: job.organizationId,
        userId: job.createdBy,
        jobId: job.id,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        jsonMode: Boolean(job.payload.jsonMode),
      };
      const result = await registry.chatProvider().complete(messages, opts);
      return { result: { text: result.text, usage: result.usage, json: result.json }, provider: result.provider, model: result.model };
    }
    case 'rag': {
      const result = await ragService.run({
        organizationId: job.organizationId,
        query: String(job.payload.query ?? ''),
        supplierId: job.payload.supplierId as string | undefined,
        auditId: job.payload.auditId as string | undefined,
        grievanceId: job.payload.grievanceId as string | undefined,
        capaId: job.payload.capaId as string | undefined,
        userId: job.createdBy,
        retrieveOnly: Boolean(job.payload.retrieveOnly),
      });
      return { result: { answer: result.answer, provider: result.provider, model: result.model, usage: result.usage }, provider: result.provider ?? null, model: result.model ?? null };
    }
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

export class AiJobWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly intervalMs: number;

  constructor(intervalMs = 5_000) {
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => { void this.tick(); }, this.intervalMs);
    // Run an immediate tick.
    void this.tick();
    console.log('[ai-jobs] worker started');
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const job = await aiJobRepo.claim();
      if (!job) return;
      try {
        const res = await executeJob(job);
        await aiJobRepo.complete(job.id, res.result, res.provider ?? null, res.model ?? null);
      } catch (err) {
        const attempts = job.attempts;
        const willRetry = attempts < job.maxAttempts && !(err instanceof AiDisabledError);
        await aiJobRepo.fail(job.id, (err as Error).message, willRetry);
      }
    } catch (err) {
      // claim/lock errors are non-fatal; next tick retries.
      console.error('[ai-jobs] tick error', err);
    } finally {
      this.running = false;
    }
  }
}

export const aiJobWorker = new AiJobWorker();

/** Enqueue a knowledge-base embedding sweep (used after seeding). */
export async function enqueueIndexKnowledgeBase(organizationId: string): Promise<JobRecord> {
  return aiJobRepo.enqueue({ organizationId, type: 'index_kb', priority: 8 });
}
