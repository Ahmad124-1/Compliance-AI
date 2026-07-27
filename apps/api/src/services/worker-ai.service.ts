import { chatService } from '../modules/ai/chat.service.js';
import { memoryService } from '../modules/ai/memory/service.js';
import { vectorService } from '../modules/ai/vector/service.js';
import { query } from '../db/pool.js';
import type {
  WorkerAiConversation,
  WorkerAiMessage,
  WorkerAiDocument,
  WorkerAiTrainingSession,
  WorkerAiEmergencyContact,
  WorkerAiRightsTopic,
  WorkerAiSearchHit,
  WorkerAiUsage,
  LanguageCode,
} from '../types/worker-ai.js';

const LANGUAGE_MAP: Record<LanguageCode, string> = {
  en: 'English',
  ur: 'Urdu',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  zh: 'Chinese',
  vi: 'Vietnamese',
  tr: 'Turkish',
  es: 'Spanish',
  fr: 'French',
};

export const workerAiService = {
  async chat({ organizationId, userId, conversationId, message, language = 'en', useRag = true }: { organizationId: string; userId: string; conversationId: string; message: string; language?: LanguageCode; useRag?: boolean }): Promise<{ conversation: WorkerAiConversation; message: WorkerAiMessage }> {
    const conversation = await this.getOrCreateConversation(organizationId, userId, conversationId, message, language);
    const result = await chatService.send({
      organizationId,
      conversationId,
      message,
      userId,
      useRag,
    });
    const assistantMessage: WorkerAiMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      conversationId,
      role: 'assistant',
      content: result.text,
      language: language || 'en',
      metadata: { provider: result.provider, model: result.model },
      createdAt: new Date().toISOString(),
    };
    await memoryService.conversationTurn({
      organizationId,
      conversationId,
      role: 'assistant',
      content: result.text,
      createdBy: userId,
    });
    return { conversation, message: assistantMessage };
  },

  async getConversationHistory(organizationId: string, conversationId: string, limit = 50): Promise<WorkerAiMessage[]> {
    const { rows } = await query(
      `SELECT id, scope as conversation_id, role, content, metadata, created_at as "createdAt"
       FROM ai_memory
       WHERE organization_id = $1 AND scope = $2 AND role IN ('user', 'assistant')
       ORDER BY created_at ASC
       LIMIT $3`,
      [organizationId, conversationId, limit],
    );
    return rows.map((r: any) => ({
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role as any,
      content: r.content,
      language: 'en' as any,
      metadata: r.metadata,
      createdAt: r.createdAt,
    }));
  },

  async listConversations(_organizationId: string, _userId: string): Promise<WorkerAiConversation[]> {
    return [];
  },

  async searchKnowledge({ organizationId, query, category }: { organizationId: string; query: string; category?: string; language?: LanguageCode }): Promise<WorkerAiSearchHit[]> {
    const domains = (category ? [category as any] : ['policy', 'audit_evidence']) as any[];
    const results = await vectorService.search({
      organizationId,
      query,
      domains,
      limit: 10,
    });
    return results.map((h) => ({
      id: h.id,
      sourceType: (h.metadata.sourceType || h.domain) as any,
      title: typeof h.metadata.title === 'string' ? h.metadata.title : 'Document',
      content: h.content,
      score: h.score,
      metadata: h.metadata,
    }));
  },

  async processDocument({ organizationId, userId, file, language }: { organizationId: string; userId: string; file: { filename: string; mimeType: string; sizeBytes: number; buffer: Buffer }; language: LanguageCode }): Promise<WorkerAiDocument> {
    const document: WorkerAiDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      organizationId,
      userId,
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storagePath: `/uploads/${file.filename}`,
      summary: `Processed ${file.filename} in ${LANGUAGE_MAP[language] || language}`,
      language,
      metadata: { uploadedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    };
    return document;
  },

  async generateTrainingQuiz({ organizationId, userId, topic, _difficulty }: { organizationId: string; userId: string; topic: string; _difficulty?: string }): Promise<WorkerAiTrainingSession> {
    const session: WorkerAiTrainingSession = {
      id: `train_${Date.now()}`,
      organizationId,
      userId,
      topic,
      questions: [
        { question: `What is the main principle of ${topic}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option A' },
        { question: `How is ${topic} implemented in practice?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option B' },
        { question: `Who is responsible for ${topic}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option C' },
      ],
      completed: false,
      createdAt: new Date().toISOString(),
    };
    return session;
  },

  async listEmergencyContacts(organizationId: string): Promise<WorkerAiEmergencyContact[]> {
    const { rows } = await query(
      'SELECT id, organization_id, contact_type as type, name, phone, extension, available_24x7 as "available24x7", description FROM emergency_contacts WHERE organization_id = $1 AND active = true ORDER BY contact_type',
      [organizationId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      organizationId: r.organization_id,
      type: r.type as any,
      name: r.name,
      phone: r.phone,
      extension: r.extension,
      available24x7: r.available24x7,
      description: r.description,
    }));
  },

  async listRightsTopics(_organizationId: string, language: LanguageCode = 'en'): Promise<WorkerAiRightsTopic[]> {
    const baseTopics: Array<Omit<WorkerAiRightsTopic, 'id'>> = [
      { key: 'working_hours', title: 'Working Hours & Overtime', description: 'Maximum weekly hours, overtime rules, rest periods, and meal breaks.', category: 'rights', language },
      { key: 'leave', title: 'Leave Entitlement', description: 'Annual leave, sick leave, maternity/paternity leave, and public holidays.', category: 'leave', language },
      { key: 'payroll', title: 'Payroll & Wages', description: 'Minimum wage, payslip breakdown, deductions, and payment schedule.', category: 'payroll', language },
      { key: 'health_safety', title: 'Health & Safety', description: 'PPE requirements, incident reporting, factory safety procedures, and emergency protocols.', category: 'health_safety', language },
      { key: 'child_labour', title: 'Child Labour Policy', description: 'Minimum age requirements, restricted work types for young workers, and apprenticeship rules.', category: 'rights', language },
      { key: 'forced_labour', title: 'Forced Labour & Human Rights', description: 'Freedom of movement, debt bondage prevention, and trafficking prevention.', category: 'rights', language },
      { key: 'grievance', title: 'Grievance Process', description: 'How to raise concerns, escalation procedures, timelines, and protection against retaliation.', category: 'grievance', language },
      { key: 'training', title: 'Training & Development', description: 'Mandatory training programs, skill development opportunities, and completion tracking.', category: 'training', language },
    ];
    return baseTopics.map((t, i) => ({ id: `topic_${i}`, ...t }));
  },

  async getUsageStats(organizationId: string): Promise<WorkerAiUsage> {
    const { rows } = await query(
      `SELECT scope, COUNT(*) as count FROM ai_memory WHERE organization_id = $1 AND role = 'user' GROUP BY scope`,
      [organizationId],
    );
    const conversations = rows.filter((r: any) => r.scope === 'conversation_list').length;
    const messages = rows.reduce((acc: number, r: any) => acc + parseInt(r.count, 10), 0);
    return {
      organizationId,
      conversations,
      messages,
      documentsProcessed: 0,
      trainingCompleted: 0,
      byLanguage: { en: messages, ur: 0, ar: 0, hi: 0, bn: 0, zh: 0, vi: 0, tr: 0, es: 0, fr: 0 },
      recentActivity: [],
    };
  },

  async getAvailableLanguages(): Promise<Array<{ code: LanguageCode; name: string; nativeName: string; supported: boolean }>> {
    return [
      { code: 'en', name: 'English', nativeName: 'English', supported: true },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', supported: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', supported: true },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', supported: true },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', supported: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', supported: true },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', supported: true },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', supported: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', supported: true },
      { code: 'fr', name: 'French', nativeName: 'Français', supported: true },
    ];
  },

  async getOrCreateConversation(organizationId: string, userId: string, conversationId: string, firstMessage: string, language: LanguageCode): Promise<WorkerAiConversation> {
    return {
      id: conversationId,
      organizationId,
      userId,
      title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : ''),
      language,
      context: {},
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
