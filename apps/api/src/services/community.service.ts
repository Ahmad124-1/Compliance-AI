import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { communityRepo } from '../repositories/community.repo.js';

export const communityService = {
  async listPosts(orgId: string, filters: { postType?: string; category?: string; limit?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return communityRepo.findPosts(orgId, filters);
  },

  async getPost(orgId: string, id: string) {
    const post = await communityRepo.findPostById(orgId, id);
    if (!post) throw new NotFoundError('Post not found');
    const comments = await communityRepo.findComments(orgId, id);
    return { ...post, comments };
  },

  async createPost(orgId: string, userId: string, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const post = await communityRepo.create({ organizationId: orgId, userId, ...input });
    await audit({ organizationId: orgId, actorId: userId, action: 'community.post.create', entity: 'community_post', entityId: post.id });
    return post;
  },

  async updatePost(orgId: string, id: string, userId: string, patch: any) {
    const post = await communityRepo.findPostById(orgId, id);
    if (!post) throw new NotFoundError('Post not found');
    const updated = await communityRepo.update(orgId, id, patch);
    if (!updated) throw new NotFoundError('Post update failed');
    await audit({ organizationId: orgId, actorId: userId, action: 'community.post.update', entity: 'community_post', entityId: id });
    return updated;
  },

  async deletePost(orgId: string, id: string, userId: string) {
    const post = await communityRepo.findPostById(orgId, id);
    if (!post) throw new NotFoundError('Post not found');
    const ok = await communityRepo.delete(orgId, id);
    await audit({ organizationId: orgId, actorId: userId, action: 'community.post.delete', entity: 'community_post', entityId: id });
    return ok;
  },

  async listComments(orgId: string, postId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return communityRepo.findComments(orgId, postId);
  },

  async createComment(orgId: string, postId: string, userId: string, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const post = await communityRepo.findPostById(orgId, postId);
    if (!post) throw new NotFoundError('Post not found');
    const comment = await communityRepo.createComment({ organizationId: orgId, postId, userId, ...input });
    await communityRepo.incrementCommentCount(orgId, postId, 1);
    await audit({ organizationId: orgId, actorId: userId, action: 'community.comment.create', entity: 'community_comment', entityId: comment.id });
    return comment;
  },

  async likePost(orgId: string, postId: string, userId: string) {
    const post = await communityRepo.findPostById(orgId, postId);
    if (!post) throw new NotFoundError('Post not found');
    const liked = await communityRepo.likePost(orgId, postId);
    await audit({ organizationId: orgId, actorId: userId, action: 'community.post.like', entity: 'community_post', entityId: postId });
    return liked;
  },
};
