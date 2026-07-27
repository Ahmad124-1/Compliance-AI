import { query } from '../db/pool.js';
import type { EngagementCommunityPost, EngagementCommunityComment } from '../types/engagement.js';

function mapPost(row: any): EngagementCommunityPost {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    postType: row.post_type,
    title: row.title,
    body: row.body,
    category: row.category,
    tags: row.tags ?? [],
    likesCount: parseInt(row.likes_count, 10),
    commentsCount: parseInt(row.comments_count, 10),
    isPinned: row.is_pinned,
    isAnonymous: row.is_anonymous,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row: any): EngagementCommunityComment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    postId: row.post_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    body: row.body,
    likesCount: parseInt(row.likes_count, 10),
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
  };
}

export const communityRepo = {
  async findPosts(orgId: string, filters: { postType?: string; category?: string; userId?: string; limit?: number } = {}): Promise<EngagementCommunityPost[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.postType) { conditions.push(`post_type = $${idx++}`); params.push(filters.postType); }
    if (filters.category) { conditions.push(`category = $${idx++}`); params.push(filters.category); }
    if (filters.userId) { conditions.push(`user_id = $${idx++}`); params.push(filters.userId); }
    const limit = filters.limit ? `LIMIT ${filters.limit}` : '';
    const { rows } = await query(`SELECT * FROM engagement_community_posts WHERE ${conditions.join(' AND ')} ORDER BY is_pinned DESC, created_at DESC ${limit}`, params);
    return rows.map(mapPost);
  },

  async findPostById(orgId: string, id: string): Promise<EngagementCommunityPost | null> {
    const { rows } = await query(`SELECT * FROM engagement_community_posts WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapPost(rows[0]) : null;
  },

  async create(input: { organizationId: string; userId: string; postType: string; title: string; body: string; category?: string; tags?: string[]; isAnonymous?: boolean }): Promise<EngagementCommunityPost> {
    const { rows } = await query<EngagementCommunityPost>(
      `INSERT INTO engagement_community_posts (organization_id, user_id, post_type, title, body, category, tags, is_anonymous) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [input.organizationId, input.userId, input.postType, input.title, input.body, input.category ?? null, input.tags ?? [], input.isAnonymous ?? false],
    );
    return mapPost(rows[0]);
  },

  async update(orgId: string, id: string, patch: Partial<EngagementCommunityPost>): Promise<EngagementCommunityPost | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title) set('title', patch.title);
    if (patch.body) set('body', patch.body);
    if (patch.category) set('category', patch.category);
    if (patch.tags) set('tags', patch.tags);
    if (patch.isPinned !== undefined) set('is_pinned', patch.isPinned);
    if (!sets.length) return this.findPostById(orgId, id);
    sets.push(`updated_at = now()`);
    params.push(orgId, id);
    const { rows } = await query(`UPDATE engagement_community_posts SET ${sets.join(', ')} WHERE organization_id = $${i - 1} AND id = $${i} RETURNING *`, params);
    return rows[0] ? mapPost(rows[0]) : null;
  },

  async delete(orgId: string, id: string): Promise<boolean> {
    const { rowCount } = await query(`DELETE FROM engagement_community_posts WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return (rowCount ?? 0) > 0;
  },

  async findComments(orgId: string, postId: string): Promise<EngagementCommunityComment[]> {
    const { rows } = await query(`SELECT * FROM engagement_community_comments WHERE organization_id = $1 AND post_id = $2 ORDER BY created_at ASC`, [orgId, postId]);
    return rows.map(mapComment);
  },

  async createComment(input: { organizationId: string; postId: string; userId: string; body: string; parentCommentId?: string | null; isAnonymous?: boolean }): Promise<EngagementCommunityComment> {
    const { rows } = await query<EngagementCommunityComment>(
      `INSERT INTO engagement_community_comments (organization_id, post_id, user_id, parent_comment_id, body, is_anonymous) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.organizationId, input.postId, input.userId, input.parentCommentId ?? null, input.body, input.isAnonymous ?? false],
    );
    return mapComment(rows[0]);
  },

  async likePost(orgId: string, id: string): Promise<EngagementCommunityPost | null> {
    const { rows } = await query(`UPDATE engagement_community_posts SET likes_count = likes_count + 1, updated_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *`, [orgId, id]);
    return rows[0] ? mapPost(rows[0]) : null;
  },

  async incrementCommentCount(orgId: string, postId: string, delta: number = 1): Promise<void> {
    await query(`UPDATE engagement_community_posts SET comments_count = comments_count + $1, updated_at = now() WHERE organization_id = $2 AND id = $3`, [delta, orgId, postId]);
  },
};
