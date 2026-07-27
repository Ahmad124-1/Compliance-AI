export type LanguageCode = 'en' | 'ur' | 'ar' | 'hi' | 'bn' | 'zh' | 'vi' | 'tr' | 'es' | 'fr';

export interface WorkerAiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: LanguageCode;
  citations?: Array<{ title: string; score: number }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkerAiConversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  language: LanguageCode;
  context: Record<string, unknown>;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerAiDocument {
  id: string;
  organizationId: string;
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  summary?: string;
  language: LanguageCode;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WorkerAiTrainingSession {
  id: string;
  organizationId: string;
  userId: string;
  topic: string;
  questions: Array<{ question: string; options: string[]; answer: string }>;
  score?: number;
  completed: boolean;
  createdAt: string;
}

export interface WorkerAiEmergencyContact {
  id: string;
  organizationId: string;
  type: 'fire' | 'medical' | 'security' | 'hr' | 'external';
  name: string;
  phone: string;
  extension?: string | null;
  available24x7: boolean;
  description?: string | null;
}

export interface WorkerAiRightsTopic {
  id: string;
  key: string;
  title: string;
  description: string;
  category: 'rights' | 'health_safety' | 'leave' | 'payroll' | 'training' | 'grievance';
  language: LanguageCode;
}

export interface WorkerAiSearchHit {
  id: string;
  sourceType: 'policy' | 'faq' | 'procedure' | 'training' | 'emergency';
  title: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface WorkerAiUsage {
  organizationId: string;
  conversations: number;
  messages: number;
  documentsProcessed: number;
  trainingCompleted: number;
  byLanguage: Record<LanguageCode, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}
