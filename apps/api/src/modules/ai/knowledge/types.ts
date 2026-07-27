/**
 * Compliance Knowledge Base — domain types.
 *
 * Models the curated compliance corpus (standards + clauses) plus the indexed,
 * chunked knowledge entries used for retrieval. Covers SA8000, SMETA, SEDEX,
 * BSCI, ISO 9001/14001/45001, WRAP, SLCP, Higg FEM, GOTS, SBTi, UN Guiding
 * Principles, ILO Conventions and local labour laws.
 */
export type KnowledgeCategory =
  | 'social'
  | 'quality'
  | 'environment'
  | 'energy'
  | 'esg'
  | 'legal'
  | 'custom';

export type KnowledgeDomain =
  | 'policy'
  | 'audit'
  | 'capa'
  | 'grievance'
  | 'evidence'
  | 'supplier';

export interface KnowledgeStandard {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  publisher: string | null;
  category: KnowledgeCategory;
  jurisdiction: string | null;
  description: string | null;
  version: string | null;
  sourceUrl: string | null;
  isBuiltin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeClause {
  id: string;
  standardId: string;
  parentId: string | null;
  code: string | null;
  title: string;
  body: string;
  category: string | null;
  position: number;
  children?: KnowledgeClause[];
}

export interface KnowledgeEntry {
  id: string;
  organizationId: string | null;
  standardId: string | null;
  clauseId: string | null;
  domain: KnowledgeDomain;
  title: string;
  content: string;
  language: string;
  metadata: Record<string, unknown>;
  chunkIndex: number;
  chunkCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SUPPORTED_STANDARDS: Array<{
  code: string;
  name: string;
  publisher: string;
  category: KnowledgeCategory;
  jurisdiction?: string;
}> = [
  { code: 'SA8000', name: 'SA8000 Social Accountability', publisher: 'SAI', category: 'social' },
  { code: 'SMETA', name: 'SMETA 7.0 (Sedex Members Ethical Trade Audit)', publisher: 'Sedex', category: 'social' },
  { code: 'SEDEX', name: 'SEDEX Member Compliance', publisher: 'Sedex', category: 'social' },
  { code: 'BSCI', name: 'Business Social Compliance Initiative (amfori BSCI)', publisher: 'amfori', category: 'social' },
  { code: 'ISO9001', name: 'ISO 9001 Quality Management', publisher: 'ISO', category: 'quality' },
  { code: 'ISO14001', name: 'ISO 14001 Environmental Management', publisher: 'ISO', category: 'environment' },
  { code: 'ISO45001', name: 'ISO 45001 Occupational Health & Safety', publisher: 'ISO', category: 'social' },
  { code: 'WRAP', name: 'Worldwide Responsible Accredited Production', publisher: 'WRAP', category: 'social' },
  { code: 'SLCP', name: 'Social & Labor Convergence Program', publisher: 'SLCP', category: 'social' },
  { code: 'HIGG_FEM', name: 'Higg Facility Environmental Module', publisher: 'Cascale', category: 'environment' },
  { code: 'GOTS', name: 'Global Organic Textile Standard', publisher: 'GOTS', category: 'environment' },
  { code: 'SBTI', name: 'Science Based Targets initiative', publisher: 'SBTi', category: 'esg' },
  { code: 'UNGP', name: 'UN Guiding Principles on Business & Human Rights', publisher: 'UN', category: 'legal' },
  { code: 'ILO', name: 'ILO Conventions (Core Labour Standards)', publisher: 'ILO', category: 'legal' },
  { code: 'LOCAL_LABOUR', name: 'Local Labour Laws', publisher: 'National Legislature', category: 'legal', jurisdiction: 'Global' },
];
