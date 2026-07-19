import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import {
  searchRepo,
  savedSearchRepo,
  recentSearchRepo,
  type SearchParams,
  type SearchScope,
  type SearchFilters,
  type SearchSortField,
} from '../repositories/search.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const searchService = {
  async globalSearch(input: {
    organizationId: string;
    scope?: SearchScope;
    term: string;
    filters?: SearchFilters;
    sortField?: SearchSortField;
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    userId?: string;
    record?: boolean;
  }) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');

    const params: SearchParams = {
      organizationId: input.organizationId,
      scope: input.scope ?? 'all',
      term: input.term,
      filters: input.filters,
      sortField: input.sortField,
      sortDir: input.sortDir,
      limit: input.limit,
      offset: input.offset,
    };

    const { hits, total } = await searchRepo.search(params);

    if (input.record && input.userId && input.term.trim().length > 0) {
      await recentSearchRepo.record(input.organizationId, input.userId, params.scope, input.term, total);
    }

    if (input.userId) {
      await audit({
        organizationId: input.organizationId,
        actorId: input.userId,
        action: 'search.performed',
        entity: 'search',
        metadata: { scope: params.scope, term: input.term, resultCount: total },
      });
    }

    return {
      hits,
      total,
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      scope: params.scope,
    };
  },

  async listSaved(orgId: string, userId: string) {
    return savedSearchRepo.list(orgId, userId);
  },

  async save(orgId: string, userId: string, input: { name: string; scope: string; query: string; filters?: Record<string, unknown>; isGlobal?: boolean }) {
    const saved = await savedSearchRepo.create({ organizationId: orgId, userId, ...input });
    await audit({ organizationId: orgId, actorId: userId, action: 'search.saved', entity: 'saved_search', entityId: saved.id });
    return saved;
  },

  async deleteSaved(orgId: string, userId: string, id: string) {
    await savedSearchRepo.remove(orgId, userId, id);
    await audit({ organizationId: orgId, actorId: userId, action: 'search.saved_deleted', entity: 'saved_search', entityId: id });
  },

  async listRecent(orgId: string, userId: string, limit?: number) {
    return recentSearchRepo.list(orgId, userId, limit);
  },

  async clearRecent(orgId: string, userId: string) {
    await recentSearchRepo.clear(orgId, userId);
  },
};
