export interface StatusUpdate {
  id: string;
  organizationId: string;
  caseId: string;
  updateType: string;
  title: string;
  message: string;
  isPublic: boolean;
  isAnonymous: boolean;
  recipientType: string;
  recipientIds: string[];
  channel: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  organizationId: string;
  caseId: string;
  actorId: string | null;
  actorType: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  isAnonymous: boolean;
  createdAt: string;
}
