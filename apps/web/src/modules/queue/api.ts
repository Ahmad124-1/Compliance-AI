import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { QUEUE_ENDPOINTS } from './constants.js';
import type { QueueJob, QueueStats } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `?${q}` : '';
}

export const queueApi = {
  list: (params?: { queueName?: string; status?: string; limit?: number; offset?: number }) =>
    http<QueueJob[]>(`${QUEUE_ENDPOINTS.jobs}${qs({
      queueName: params?.queueName,
      status: params?.status,
      limit: params?.limit?.toString(),
      offset: params?.offset?.toString(),
    })}`),

  stats: (queueName?: string) => http<QueueStats>(`${QUEUE_ENDPOINTS.stats}${qs({ queueName })}`),

  dequeue: (queueName: string) => http<QueueJob>(QUEUE_ENDPOINTS.dequeue(queueName), { method: 'POST' }),

  retry: (id: string) => http<QueueJob>(QUEUE_ENDPOINTS.retry(id), { method: 'POST' }),

  cancel: (id: string) => http<QueueJob>(QUEUE_ENDPOINTS.cancel(id), { method: 'POST' }),

  deadLetter: (id: string) => http<QueueJob>(QUEUE_ENDPOINTS.deadLetter(id), { method: 'POST' }),

  processDeadLetter: (id: string) => http<QueueJob>(QUEUE_ENDPOINTS.processDeadLetter(id), { method: 'POST' }),

  cleanup: (olderThan?: string) => http<{ deletedIds: string[]; count: number }>(QUEUE_ENDPOINTS.cleanup, { method: 'POST', body: JSON.stringify({ olderThan }) }),
};
