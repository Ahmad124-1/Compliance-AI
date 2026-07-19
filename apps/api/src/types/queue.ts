export type QueueJobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'dead_letter';

export interface QueueJob {
  id: string;
  organizationId: string | null;
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  status: QueueJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueJobPayload {
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  scheduledAt?: Date;
}
