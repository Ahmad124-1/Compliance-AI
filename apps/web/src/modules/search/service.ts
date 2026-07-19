import { searchApi } from './api.js';
import type { SearchParams } from './types.js';

export const searchService = {
  search: (params: SearchParams) => searchApi.search(params),
  listSaved: () => searchApi.listSaved(),
  save: (input: { name: string; scope: string; query: string; filters?: Record<string, unknown>; isGlobal?: boolean }) =>
    searchApi.save(input),
  deleteSaved: (id: string) => searchApi.deleteSaved(id),
  listRecent: () => searchApi.listRecent(),
  clearRecent: () => searchApi.clearRecent(),
};
