export type WorkerUpdateType = 'status_change' | 'case_update' | 'public_message' | 'additional_info_request' | 'acknowledgement' | 'resolution_notice' | 'case_closed' | 'feedback_request';
export type RecipientType = 'reporter' | 'assigned_to' | 'watchers' | 'all';
export type ActorType = 'system' | 'user' | 'worker';

export interface WorkerStatusUpdate {
  id: string;
  organizationId: string;
  caseId: string;
  updateType: WorkerUpdateType;
  title: string;
  message: string;
  isPublic: boolean;
  isAnonymous: boolean;
  recipientType: RecipientType;
  recipientIds: string[];
  channel: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkerCommunicationTimeline {
  id: string;
  organizationId: string;
  caseId: string;
  actorId: string | null;
  actorType: ActorType;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  isAnonymous: boolean;
  createdAt: Date;
}
