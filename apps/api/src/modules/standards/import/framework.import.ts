import { standardRepo } from '../repositories/standard.repo.js';
import { frameworkRepo, frameworkCategoryRepo, clauseRepo, requirementRepo, controlRepo } from '../repositories/framework.repo.js';

export interface ImportControl {
  title: string;
  description?: string;
  controlType?: string;
}
export interface ImportRequirement {
  code?: string;
  title: string;
  description?: string;
  mandatory?: boolean;
  controls?: ImportControl[];
}
export interface ImportClause {
  code?: string;
  title: string;
  description?: string;
  requirements?: ImportRequirement[];
  children?: ImportClause[];
}
export interface ImportCategory {
  code?: string;
  name: string;
  position?: number;
}
export interface FrameworkImportPayload {
  standard: {
    name: string;
    code: string;
    description?: string;
    publisher?: string;
    category?: string;
  };
  framework: {
    version: string;
    title: string;
    description?: string;
    status?: 'draft' | 'published' | 'deprecated';
  };
  categories?: ImportCategory[];
  clauses?: ImportClause[];
  requirements?: ImportRequirement[]; // top-level requirements (no clause)
}

/**
 * Idempotent import of a full framework definition.
 * Creates the standard (if missing by code) and a new framework version, then
 * builds categories, clause tree, requirements and controls.
 */
export async function frameworkImport(payload: FrameworkImportPayload): Promise<{ id: string }> {
  const std = (await standardRepo.findByCode(payload.standard.code)) ?? (await standardRepo.create({ ...payload.standard, isBuiltin: true, isActive: true, category: payload.standard.category as any }));
  const fw = await frameworkRepo.create({
    standardId: std.id,
    version: payload.framework.version,
    title: payload.framework.title,
    description: payload.framework.description ?? null,
    status: payload.framework.status ?? 'published',
    publishedAt: payload.framework.status === 'published' ? new Date() : null,
    isActive: true,
  });

  const catMap = new Map<string, string>();
  for (const c of payload.categories ?? []) {
    const created = await frameworkCategoryRepo.create(fw.id, c.name, { code: c.code ?? null, position: c.position ?? 0 });
    if (c.code) catMap.set(c.code, created.id);
  }

  const buildClause = async (clause: ImportClause, parentId: string | null): Promise<void> => {
    const created = await clauseRepo.create(fw.id, clause.title, {
      parentId,
      code: clause.code ?? null,
      description: clause.description ?? null,
    });
    for (const req of clause.requirements ?? []) {
      const r = await requirementRepo.create(fw.id, req.title, {
        clauseId: created.id,
        code: req.code ?? null,
        description: req.description ?? null,
        mandatory: req.mandatory ?? true,
      });
      for (const ctrl of req.controls ?? []) {
        await controlRepo.create(r.id, ctrl.title, { description: ctrl.description ?? null, controlType: ctrl.controlType ?? null });
      }
    }
    for (const child of clause.children ?? []) await buildClause(child, created.id);
  };
  for (const clause of payload.clauses ?? []) await buildClause(clause, null);

  for (const req of payload.requirements ?? []) {
    const r = await requirementRepo.create(fw.id, req.title, {
      code: req.code ?? null,
      description: req.description ?? null,
      mandatory: req.mandatory ?? true,
    });
    for (const ctrl of req.controls ?? []) {
      await controlRepo.create(r.id, ctrl.title, { description: ctrl.description ?? null, controlType: ctrl.controlType ?? null });
    }
  }

  return { id: fw.id };
}

