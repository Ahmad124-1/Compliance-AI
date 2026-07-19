export interface OrganizationCommunicationSettings {
  id: string;
  organizationId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  branding: Record<string, unknown>;
  emailAddress: string | null;
  smsSenderId: string | null;
  whatsappNumber: string | null;
  hotlineNumber: string | null;
  voiceRecordingEnabled: boolean;
  suggestionBoxEnabled: boolean;
  walkInEnabled: boolean;
  unionChannelEnabled: boolean;
  ngoChannelEnabled: boolean;
  governmentChannelEnabled: boolean;
  mobileAppEnabled: boolean;
  notificationSettings: Record<string, unknown>;
  privacySettings: Record<string, unknown>;
  retentionPolicyDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}
