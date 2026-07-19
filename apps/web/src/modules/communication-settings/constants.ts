export const COMM_SETTINGS_ENDPOINTS = {
  get: '/api/v1/communication-settings',
  update: '/api/v1/communication-settings',
  branding: '/api/v1/communication-settings/branding',
  channels: '/api/v1/communication-settings/channels',
  notifications: '/api/v1/communication-settings/notifications',
  privacy: '/api/v1/communication-settings/privacy',
} as const;

export const COMM_SETTINGS_ROUTES = {
  settings: '/communication-settings',
} as const;

export const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  hotline: 'Hotline',
  voice: 'Voice Recording',
  suggestionBox: 'Suggestion Box',
  walkIn: 'Walk-in',
  union: 'Union Channel',
  ngo: 'NGO Channel',
  government: 'Government Channel',
  mobileApp: 'Mobile App',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  zh: 'Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
};
