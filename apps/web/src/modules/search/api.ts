import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SEARCH_ENDPOINTS } from './constants.js';
import type {
  SearchParams,
  SearchResponse,
  SavedSearch,
  RecentSearch,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const searchApi = {
  search: (params: SearchParams) => {
    const qs = new URLSearchParams();
    qs.set('term', params.term);
    if (params.scope && params.scope !== 'all') qs.set('scope', params.scope);
    if (params.sortField) qs.set('sortField', params.sortField);
    if (params.sortDir) qs.set('sortDir', params.sortDir);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const f = params.filters;
    if (f) {
      if (f.status) qs.set('status', f.status);
      if (f.priority) qs.set('priority', f.priority);
      if (f.severity) qs.set('severity', f.severity);
      if (f.category) qs.set('category', f.category);
      if (f.source) qs.set('source', f.source);
      if (f.anonymous !== undefined) qs.set('anonymous', String(f.anonymous));
      if (f.dateFrom) qs.set('dateFrom', f.dateFrom);
      if (f.dateTo) qs.set('dateTo', f.dateTo);
      if (f.factoryId) qs.set('factoryId', f.factoryId);
      if (f.departmentId) qs.set('departmentId', f.departmentId);
      if (f.assignedTo) qs.set('assignedTo', f.assignedTo);
    }
    return http<SearchResponse>(`${SEARCH_ENDPOINTS.search}?${qs.toString()}`);
  },
  listSaved: () => http<SavedSearch[]>(SEARCH_ENDPOINTS.saved),
  save: (input: { name: string; scope: string; query: string; filters?: Record<string, unknown>; isGlobal?: boolean }) =>
    http<SavedSearch>(SEARCH_ENDPOINTS.saved, { method: 'POST', body: JSON.stringify(input) }),
  deleteSaved: (id: string) => http<void>(`${SEARCH_ENDPOINTS.saved}/${id}`, { method: 'DELETE' }),
  listRecent: () => http<RecentSearch[]>(SEARCH_ENDPOINTS.recent),
  clearRecent: () => http<void>(SEARCH_ENDPOINTS.recent, { method: 'DELETE' }),
};
