export const WORKER_AI_ENDPOINTS = {
  chat: '/api/v1/worker-ai/chat',
  chatStream: '/api/v1/worker-ai/chat/stream',
  history: '/api/v1/worker-ai/history',
  conversations: '/api/v1/worker-ai/conversations',
  documents: '/api/v1/worker-ai/documents',
  documentUpload: '/api/v1/worker-ai/documents',
  voiceTranscribe: '/api/v1/worker-ai/voice/transcribe',
  voiceSynthesize: '/api/v1/worker-ai/voice/synthesize',
  trainingQuiz: '/api/v1/worker-ai/training/quiz',
  trainingRecommendations: '/api/v1/worker-ai/training/recommendations',
  trainingProgress: '/api/v1/worker-ai/training/progress',
  knowledgeSearch: '/api/v1/worker-ai/knowledge/search',
  rightsTopics: '/api/v1/worker-ai/rights/topics',
  emergencyContacts: '/api/v1/worker-ai/emergency/contacts',
  languages: '/api/v1/worker-ai/languages',
  translate: '/api/v1/worker-ai/translate',
  usage: '/api/v1/worker-ai/usage',
} as const;

export const WORKER_AI_ROUTES = {
  home: '/worker-ai',
  chat: '/worker-ai/chat',
  documents: '/worker-ai/documents',
  training: '/worker-ai/training',
  rights: '/worker-ai/rights',
  emergency: '/worker-ai/emergency',
} as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
] as const;

export const EMERGENCY_TYPE_LABELS: Record<string, string> = {
  fire: 'Fire',
  medical: 'Medical Emergency',
  security: 'Security',
  hr: 'HR / Grievance',
  external: 'External Authority',
};

export const RIGHTS_CATEGORY_LABELS: Record<string, string> = {
  rights: 'Worker Rights',
  health_safety: 'Health & Safety',
  leave: 'Leave & Benefits',
  payroll: 'Payroll & Wages',
  training: 'Training & Development',
  grievance: 'Grievance Process',
};
