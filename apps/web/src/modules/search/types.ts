export type SearchScope =
  | 'all'
  | 'complaints'
  | 'cases'
  | 'tracking'
  | 'factories'
  | 'departments'
  | 'organizations'
  | 'investigators'
  | 'categories'
  | 'notifications'
  | 'qr_codes'
  | 'templates';

export type SearchSortField = 'relevance' | 'created_at' | 'updated_at' | 'title' | 'name' | 'status';

export interface SearchFilters {
  status?: string;
  priority?: string;
  severity?: string;
  category?: string;
  source?: string;
  anonymous?: boolean;
  dateFrom?: string;
  dateTo?: string;
  factoryId?: string;
  departmentId?: string;
  assignedTo?: string;
}

export interface SearchHit {
  id: string;
  scope: string;
  title: string;
  subtitle: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string | null;
  url: string;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  hits: SearchHit[];
  total: number;
  limit: number;
  offset: number;
  scope: SearchScope;
}

export interface SavedSearch {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  scope: string;
  query: string;
  filters: Record<string, unknown>;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentSearch {
  id: string;
  organizationId: string;
  userId: string;
  scope: string;
  query: string;
  resultCount: number;
  lastRunAt: string;
  createdAt: string;
}

export interface SearchParams {
  term: string;
  scope?: SearchScope;
  filters?: SearchFilters;
  sortField?: SearchSortField;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
