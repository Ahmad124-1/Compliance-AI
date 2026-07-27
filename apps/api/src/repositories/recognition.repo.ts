import { query } from '../db/pool.js';
import type { EngagementRecognitionType, EngagementRecognition, EngagementRecognitionPoints } from '../types/engagement.js';

function mapType(row: any): EngagementRecognitionType {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category,
    iconUrl: row.icon_url,
    pointsValue: parseInt(row.points_value, 10),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecognition(row: any): EngagementRecognition {
  return {
    id: row.id,
    organizationId: row.organization_id,
    recognitionTypeId: row.recognition_type_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    message: row.message,
    pointsAwarded: parseInt(row.points_awarded, 10),
    isPublic: row.is_public,
    isManagerRecognition: row.is_manager_recognition,
    category: row.category,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPoints(row: any): EngagementRecognitionPoints {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    recognitionId: row.recognition_id,
    points: parseInt(row.points, 10),
    reason: row.reason,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export const recognitionRepo = {
  async findTypeById(orgId: string, id: string): Promise<EngagementRecognitionType | null> {
    const { rows } = await query(`SELECT * FROM engagement_recognition_types WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapType(rows[0]) : null;
  },

  async findTypes(orgId: string): Promise<EngagementRecognitionType[]> {
    const { rows } = await query(`SELECT * FROM engagement_recognition_types WHERE organization_id = $1 ORDER BY created_at DESC`, [orgId]);
    return rows.map(mapType);
  },

  async createType(input: { organizationId: string; name: string; description?: string; category?: string; iconUrl?: string | null; pointsValue?: number }): Promise<EngagementRecognitionType> {
    const { rows } = await query<EngagementRecognitionType>(
      `INSERT INTO engagement_recognition_types (organization_id, name, description, category, icon_url, points_value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.organizationId, input.name, input.description ?? null, input.category ?? 'peer', input.iconUrl ?? null, input.pointsValue ?? 0],
    );
    return mapType(rows[0]);
  },

  async updateType(orgId: string, id: string, patch: Partial<EngagementRecognitionType>): Promise<EngagementRecognitionType | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name) set('name', patch.name);
    if (patch.description) set('description', patch.description);
    if (patch.category) set('category', patch.category);
    if (patch.iconUrl !== undefined) set('icon_url', patch.iconUrl);
    if (patch.pointsValue !== undefined) set('points_value', patch.pointsValue);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findTypeById(orgId, id);
    sets.push(`updated_at = now()`);
    params.push(orgId, id);
    const { rows } = await query(`UPDATE engagement_recognition_types SET ${sets.join(', ')} WHERE organization_id = $${i - 1} AND id = $${i} RETURNING *`, params);
    return rows[0] ? mapType(rows[0]) : null;
  },

  async findMany(orgId: string, filters: { toUserId?: string; fromUserId?: string; category?: string; limit?: number } = {}): Promise<EngagementRecognition[]> {
    const conditions = ['r.organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.toUserId) { conditions.push(`r.to_user_id = $${idx++}`); params.push(filters.toUserId); }
    if (filters.fromUserId) { conditions.push(`r.from_user_id = $${idx++}`); params.push(filters.fromUserId); }
    if (filters.category) { conditions.push(`r.category = $${idx++}`); params.push(filters.category); }
    const limit = filters.limit ? `LIMIT ${filters.limit}` : '';
    const { rows } = await query(`SELECT r.*, COALESCE(pt.name, r.category) as display_type FROM engagement_recognitions r LEFT JOIN engagement_recognition_types pt ON pt.id = r.recognition_type_id WHERE ${conditions.join(' AND ')} ORDER BY r.created_at DESC ${limit}`, params);
    return rows.map(mapRecognition);
  },

  async create(input: Partial<EngagementRecognition> & { organizationId: string; fromUserId: string; toUserId: string }): Promise<EngagementRecognition> {
    const { rows } = await query<EngagementRecognition>(
      `INSERT INTO engagement_recognitions (organization_id, recognition_type_id, from_user_id, to_user_id, message, points_awarded, is_public, is_manager_recognition, category, related_entity_type, related_entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        input.organizationId,
        input.recognitionTypeId ?? null,
        input.fromUserId,
        input.toUserId,
        input.message,
        input.pointsAwarded ?? 0,
        input.isPublic ?? true,
        input.isManagerRecognition ?? false,
        input.category ?? 'peer',
        input.relatedEntityType ?? null,
        input.relatedEntityId ?? null,
        input.metadata ?? {},
      ],
    );
    return mapRecognition(rows[0]);
  },

  async createPoints(input: { organizationId: string; userId: string; recognitionId: string; points: number; reason?: string; expiresAt?: string | null }): Promise<EngagementRecognitionPoints> {
    const { rows } = await query<EngagementRecognitionPoints>(
      `INSERT INTO engagement_recognitions_points (organization_id, user_id, recognition_id, points, reason, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.organizationId, input.userId, input.recognitionId, input.points, input.reason ?? null, input.expiresAt ?? null],
    );
    return mapPoints(rows[0]);
  },

   async getLeaderboard(orgId: string, period: string, siteId?: string, departmentId?: string): Promise<Array<{ userId: string; name: string; points: number; departmentName?: string }>> {
     const conditions: string[] = [];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (siteId) { conditions.push(`(SELECT site_id FROM worker_profiles WHERE user_id = p.user_id AND organization_id = p.organization_id LIMIT 1) = $${idx++}`); params.push(siteId); }
    if (departmentId) { conditions.push(`(SELECT department_id FROM worker_profiles WHERE user_id = p.user_id AND organization_id = p.organization_id LIMIT 1) = $${idx++}`); params.push(departmentId); }
    const dateFilter = period === 'week' ? "created_at >= now() - interval '7 days'" : period === 'month' ? "created_at >= now() - interval '30 days'" : period === 'year' ? "created_at >= now() - interval '365 days'" : null;
    if (dateFilter) conditions.push(`p.${dateFilter}`);
    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT p.user_id, COALESCE(SUM(p.points), 0) as points, u.first_name, u.last_name, d.name as department_name FROM engagement_recognitions_points p JOIN users u ON u.id = p.user_id LEFT JOIN departments d ON d.id = (SELECT department_id FROM worker_profiles WHERE user_id = p.user_id AND organization_id = p.organization_id LIMIT 1) WHERE p.organization_id = $1 ${where} GROUP BY p.user_id, u.first_name, u.last_name, d.name ORDER BY points DESC LIMIT 50`, params);
    return rows.map((r: any) => ({ userId: r.user_id, name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'User', points: parseInt(r.points, 10), departmentName: r.department_name }));
  },

  async getUserPoints(orgId: string, userId: string): Promise<number> {
    const { rows } = await query(`SELECT COALESCE(SUM(points), 0) as total FROM engagement_recognitions_points WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
    return parseInt(rows[0]?.total || '0', 10);
  },
};
