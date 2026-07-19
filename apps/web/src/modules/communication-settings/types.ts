export interface CommSettings {
  id: string;
  organizationId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    organizationName?: string;
  };
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
}
