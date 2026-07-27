import { randomUUID } from 'node:crypto';

import { audit } from '../../core/audit.js';
import { NotFoundError, BadRequestError } from '../../core/errors.js';
import { query } from '../../db/pool.js';
import { createRegistry, resolveCredentials } from '../ai/engine/registry.js';
import { aiConfigRepo } from '../ai/engine/config.repo.js';
import { renderPrompt } from '../ai/engine/prompt-engine.js';
import { tokenLedgerRepo } from '../ai/engine/token-ledger.repo.js';
import { knowledgeService } from '../ai/knowledge/service.js';
import { AiDisabledError } from '../ai/engine/providers/null.provider.js';
import type { ChatMessage, CompletionResult } from '../ai/engine/types.js';

export interface DocumentRecord {
  id: string;
  organizationId: string;
  uploadedBy: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  extractedText: string | null;
  metadata: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const documentAiService = {
  async uploadDocument(organizationId: string, userId: string | null, filename: string, contentType: string, sizeBytes: number): Promise<DocumentRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const document: DocumentRecord = {
      id,
      organizationId,
      uploadedBy: userId,
      filename,
      contentType,
      sizeBytes,
      extractedText: null,
      metadata: {},
      status: 'uploaded',
      createdAt: now,
      updatedAt: now,
    };
    await query(
      `INSERT INTO ai_documents (id, organization_id, uploaded_by, filename, content_type, size_bytes, extracted_text, metadata, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, organizationId, userId, filename, contentType, sizeBytes, null, '{}', 'uploaded', now, now],
    );
    await audit({ organizationId, actorId: userId ?? null, action: 'document.upload', entity: 'ai_document', entityId: id, metadata: { filename, contentType, sizeBytes } });
    return document;
  },

  async processDocument(organizationId: string, documentId: string): Promise<DocumentRecord> {
    const docRows = await query<Record<string, any>>(`SELECT * FROM ai_documents WHERE id = $1 AND organization_id = $2`, [documentId, organizationId]);
    const doc = docRows[0];
    if (!doc) throw new NotFoundError('Document not found');

    await query(`UPDATE ai_documents SET status = 'processing', updated_at = now() WHERE id = $1`, [documentId]);

    let extractedText = doc.extracted_text;
    if (!extractedText) {
      extractedText = `[Extracted content from ${doc.filename}]\n\nThis is a placeholder for extracted text. In production, integrate with a text extraction library (e.g., pdf-parse, mammoth, etc.) based on content type.`;
    }

    await knowledgeService.ingest({
      organizationId,
      domain: 'policy',
      title: doc.filename,
      content: extractedText,
      metadata: { source: 'document_ai', documentId, contentType: doc.content_type },
    });

    const now = new Date().toISOString();
    await query(`UPDATE ai_documents SET extracted_text = $2, status = 'processed', updated_at = now() WHERE id = $1`, [documentId, extractedText]);

    await audit({ organizationId, actorId: doc.uploaded_by, action: 'document.process', entity: 'ai_document', entityId: documentId });

    return {
      id: doc.id,
      organizationId: doc.organization_id,
      uploadedBy: doc.uploaded_by,
      filename: doc.filename,
      contentType: doc.content_type,
      sizeBytes: doc.size_bytes,
      extractedText,
      metadata: doc.metadata ?? {},
      status: 'processed',
      createdAt: doc.created_at,
      updatedAt: now,
    };
  },

  async analyze(organizationId: string, documentId: string, action: string): Promise<Record<string, unknown>> {
    const docRows = await query<Record<string, any>>(`SELECT * FROM ai_documents WHERE id = $1 AND organization_id = $2`, [documentId, organizationId]);
    const doc = docRows[0];
    if (!doc) throw new NotFoundError('Document not found');
    if (doc.status !== 'processed') throw new BadRequestError('Document has not been processed yet');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: doc.uploaded_by });

    const actionPrompts: Record<string, string> = {
      summarize: `Summarize the following document concisely.`,
      explain: `Explain the following document in simple terms.`,
      detect_gaps: `Identify compliance gaps in the following document against common standards.`,
      highlight_risks: `Highlight risks in the following document.`,
      compare_standards: `Compare the following document against relevant compliance standards.`,
      suggest_improvements: `Suggest improvements for the following document.`,
      executive_summary: `Provide an executive summary of the following document.`,
      extract_findings: `Extract key findings from the following document.`,
    };

    const prompt = actionPrompts[action] ?? `Analyze the following document:`;

    const systemPrompt = await renderPrompt(organizationId, 'document_ai.analyze', { action }, `You are ComplianceOS AI Document Analyst. ${prompt} Return structured analysis.`);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Document: ${doc.filename}\n\n${doc.extracted_text ?? ''}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: doc.uploaded_by,
        conversationId: documentId,
        model: config.model,
        temperature: 0.2,
        maxTokens: 2048,
        topP: 1,
        stream: false,
        jsonMode: false,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: doc.uploaded_by,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    const analysis = {
      documentId,
      action,
      result: result.text,
      provider: result.provider,
      model: result.model,
      analyzedAt: new Date().toISOString(),
    };

    await audit({ organizationId, actorId: doc.uploaded_by, action: `document.analyze.${action}`, entity: 'ai_document', entityId: documentId, metadata: { action } });

    return analysis;
  },

  async listDocuments(organizationId: string): Promise<DocumentRecord[]> {
    const { rows } = await query<Record<string, any>>(
      `SELECT * FROM ai_documents WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      uploadedBy: r.uploaded_by,
      filename: r.filename,
      contentType: r.content_type,
      sizeBytes: r.size_bytes,
      extractedText: r.extracted_text,
      metadata: r.metadata ?? {},
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async getDocument(id: string): Promise<DocumentRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM ai_documents WHERE id = $1`, [id]);
    const row = rows[0];
    if (!row) throw new NotFoundError('Document not found');
    return {
      id: row.id,
      organizationId: row.organization_id,
      uploadedBy: row.uploaded_by,
      filename: row.filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      extractedText: row.extracted_text,
      metadata: row.metadata ?? {},
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
