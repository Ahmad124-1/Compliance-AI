import { query } from '../../../db/pool.js';
import type { Standard, StandardCategory } from '../types.js';

function mapStandard(row: any): Standard {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    publisher: row.publisher,
    category: row.category,
    isBuiltin: row.is_builtin,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface StandardFilter {
  search?: string;
  category?: StandardCategory;
  activeOnly?: boolean;
}

export const standardRepo = {
  async create(input: {
    name: string;
    code: string;
    description?: string | null;
    publisher?: string | null;
    category?: StandardCategory | null;
    isActive?: boolean;
    isBuiltin?: boolean;
  }): Promise<Standard> {
    const { rows } = await query<Standard>(
      `INSERT INTO standards (name, code, description, publisher, category, is_active, is_builtin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.name,
        input.code,
        input.description ?? null,
        input.publisher ?? null,
        input.category ?? null,
        input.isActive ?? true,
        input.isBuiltin ?? false,
      ],
    );
    return mapStandard(rows[0]);
  },

  async findById(id: string): Promise<Standard | null> {
    const { rows } = await query(`SELECT * FROM standards WHERE id = $1`, [id]);
    return rows[0] ? mapStandard(rows[0]) : null;
  },

  async findByCode(code: string): Promise<Standard | null> {
    const { rows } = await query(`SELECT * FROM standards WHERE code = $1`, [code]);
    return rows[0] ? mapStandard(rows[0]) : null;
  },

  async list(filter: StandardFilter = {}): Promise<Standard[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filter.activeOnly) where.push(`is_active = TRUE`);
    if (filter.category) {
      where.push(`category = $${i++}`);
      params.push(filter.category);
    }
    if (filter.search) {
      where.push(`(name ILIKE $${i} OR code ILIKE $${i} OR publisher ILIKE $${i})`);
      params.push(`%${filter.search}%`);
      i++;
    }
    const sql = `SELECT * FROM standards ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name`;
    const { rows } = await query(sql, params);
    return rows.map(mapStandard);
  },

  async update(id: string, patch: Partial<Pick<Standard, 'name' | 'description' | 'publisher' | 'category' | 'isActive'>>): Promise<Standard | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.publisher !== undefined) set('publisher', patch.publisher);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE standards SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapStandard(rows[0]) : null;
  },
};

