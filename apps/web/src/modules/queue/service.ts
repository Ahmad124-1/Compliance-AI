import { queueApi } from './api.js';

export const queueService = {
  list: (params?: { queueName?: string; status?: string; limit?: number; offset?: number }) => queueApi.list(params),
  stats: (queueName?: string) => queueApi.stats(queueName),
  dequeue: (queueName: string) => queueApi.dequeue(queueName),
  retry: (id: string) => queueApi.retry(id),
  cancel: (id: string) => queueApi.cancel(id),
  deadLetter: (id: string) => queueApi.deadLetter(id),
  processDeadLetter: (id: string) => queueApi.processDeadLetter(id),
  cleanup: (olderThan?: string) => queueApi.cleanup(olderThan),
};
