import { query } from '../../../db/pool.js';
import type { Clause, Control, Framework, FrameworkCategory, Requirement } from '../types.js';

function mapFramework(row: any): Framework {
  return {
    id: row.id,
    standardId: row.standard_id,
    version: row.version,
    title: row.title,
    description: row.description,
    status: row.status,
    publishedAt: row.published_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClause(row: any): Clause {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    parentId: row.parent_id,
    categoryId: row.category_id,
    code: row.code,
    title: row.title,
    description: row.description,
    position: row.position,
  };
}

function mapCategory(row: any): FrameworkCategory {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    parentId: row.parent_id,
    name: row.name,
    code: row.code,
    position: row.position,
  };
}

function mapRequirement(row: any): Requirement {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    clauseId: row.clause_id,
    categoryId: row.category_id,
    code: row.code,
    title: row.title,
    description: row.description,
    mandatory: row.mandatory,
    position: row.position,
  };
}

function mapControl(row: any): Control {
  return {
    id: row.id,
    requirementId: row.requirement_id,
    title: row.title,
    description: row.description,
    controlType: row.control_type,
    position: row.position,
  };
}

export const frameworkRepo = {
  async create(input: Omit<Framework, 'id' | 'createdAt' | 'updatedAt'>): Promise<Framework> {
    const { rows } = await query<Framework>(
      `INSERT INTO frameworks (standard_id, version, title, description, status, published_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.standardId,
        input.version,
        input.title,
        input.description ?? null,
        input.status ?? 'draft',
        input.publishedAt ?? null,
        input.isActive ?? true,
      ],
    );
    return mapFramework(rows[0]);
  },

  async findById(id: string): Promise<Framework | null> {
    const { rows } = await query(`SELECT * FROM frameworks WHERE id = $1`, [id]);
    return rows[0] ? mapFramework(rows[0]) : null;
  },

  async listByStandard(standardId: string): Promise<Framework[]> {
    const { rows } = await query(`SELECT * FROM frameworks WHERE standard_id = $1 ORDER BY version`, [standardId]);
    return rows.map(mapFramework);
  },

  async listActive(): Promise<Framework[]> {
    const { rows } = await query(`SELECT * FROM frameworks WHERE is_active = TRUE ORDER BY title`);
    return rows.map(mapFramework);
  },

  async update(id: string, patch: Partial<Pick<Framework, 'title' | 'description' | 'status' | 'publishedAt' | 'isActive'>>): Promise<Framework | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.publishedAt !== undefined) set('published_at', patch.publishedAt);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE frameworks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapFramework(rows[0]) : null;
  },
};

export const frameworkCategoryRepo = {
  async create(frameworkId: string, name: string, opts: { parentId?: string | null; code?: string | null; position?: number } = {}): Promise<FrameworkCategory> {
    const { rows } = await query<FrameworkCategory>(
      `INSERT INTO framework_categories (framework_id, parent_id, name, code, position)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [frameworkId, opts.parentId ?? null, name, opts.code ?? null, opts.position ?? 0],
    );
    return mapCategory(rows[0]);
  },
  async listByFramework(frameworkId: string): Promise<FrameworkCategory[]> {
    const { rows } = await query(`SELECT * FROM framework_categories WHERE framework_id = $1 ORDER BY position`, [frameworkId]);
    return rows.map(mapCategory);
  },
};

export const clauseRepo = {
  async create(frameworkId: string, title: string, opts: { parentId?: string | null; categoryId?: string | null; code?: string | null; description?: string | null; position?: number } = {}): Promise<Clause> {
    const { rows } = await query<Clause>(
      `INSERT INTO clauses (framework_id, parent_id, category_id, code, title, description, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [frameworkId, opts.parentId ?? null, opts.categoryId ?? null, opts.code ?? null, title, opts.description ?? null, opts.position ?? 0],
    );
    return mapClause(rows[0]);
  },
  async listByFramework(frameworkId: string): Promise<Clause[]> {
    const { rows } = await query(`SELECT * FROM clauses WHERE framework_id = $1 ORDER BY position, code`, [frameworkId]);
    return rows.map(mapClause);
  },
  async findByFrameworkTree(frameworkId: string): Promise<Clause[]> {
    const flat = await this.listByFramework(frameworkId);
    const byId = new Map<string, Clause>();
    flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots: Clause[] = [];
    byId.forEach((c) => {
      if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children!.push(c);
      else roots.push(c);
    });
    return roots;
  },
};

export const requirementRepo = {
  async create(frameworkId: string, title: string, opts: { clauseId?: string | null; categoryId?: string | null; code?: string | null; description?: string | null; mandatory?: boolean; position?: number } = {}): Promise<Requirement> {
    const { rows } = await query<Requirement>(
      `INSERT INTO requirements (framework_id, clause_id, category_id, code, title, description, mandatory, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        frameworkId,
        opts.clauseId ?? null,
        opts.categoryId ?? null,
        opts.code ?? null,
        title,
        opts.description ?? null,
        opts.mandatory ?? true,
        opts.position ?? 0,
      ],
    );
    return mapRequirement(rows[0]);
  },
  async findById(id: string): Promise<Requirement | null> {
    const { rows } = await query(`SELECT * FROM requirements WHERE id = $1`, [id]);
    return rows[0] ? mapRequirement(rows[0]) : null;
  },
  async listByFramework(frameworkId: string, filter: { search?: string; categoryId?: string | null; clauseId?: string | null; mandatory?: boolean } = {}): Promise<Requirement[]> {
    const where: string[] = ['framework_id = $1'];
    const params: unknown[] = [frameworkId];
    let i = 2;
    if (filter.categoryId) {
      where.push(`category_id = $${i++}`);
      params.push(filter.categoryId);
    }
    if (filter.clauseId) {
      where.push(`clause_id = $${i++}`);
      params.push(filter.clauseId);
    }
    if (filter.mandatory !== undefined) {
      where.push(`mandatory = $${i++}`);
      params.push(filter.mandatory);
    }
    if (filter.search) {
      where.push(`(title ILIKE $${i} OR code ILIKE $${i} OR description ILIKE $${i})`);
      params.push(`%${filter.search}%`);
      i++;
    }
    const { rows } = await query(`SELECT * FROM requirements WHERE ${where.join(' AND ')} ORDER BY position, code`, params);
    return rows.map(mapRequirement);
  },
  async update(id: string, patch: Partial<Pick<Requirement, 'title' | 'description' | 'mandatory' | 'code' | 'position'>>): Promise<Requirement | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.mandatory !== undefined) set('mandatory', patch.mandatory);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.position !== undefined) set('position', patch.position);
    if (!sets.length) return this.findById(id);
    params.push(id);
    const { rows } = await query(`UPDATE requirements SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapRequirement(rows[0]) : null;
  },
};

export const controlRepo = {
  async create(requirementId: string, title: string, opts: { description?: string | null; controlType?: string | null; position?: number } = {}): Promise<Control> {
    const { rows } = await query<Control>(
      `INSERT INTO controls (requirement_id, title, description, control_type, position)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [requirementId, title, opts.description ?? null, opts.controlType ?? null, opts.position ?? 0],
    );
    return mapControl(rows[0]);
  },
  async listByRequirement(requirementId: string): Promise<Control[]> {
    const { rows } = await query(`SELECT * FROM controls WHERE requirement_id = $1 ORDER BY position`, [requirementId]);
    return rows.map(mapControl);
  },
};

