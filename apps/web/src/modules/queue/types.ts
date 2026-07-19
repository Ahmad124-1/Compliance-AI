export interface QueueJob {
  id: string;
  organizationId: string | null;
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  total: number;
  byStatus: Record<string, number>;
  byQueue: Record<string, number>;
}
