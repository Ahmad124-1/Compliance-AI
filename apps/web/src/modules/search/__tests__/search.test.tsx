import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '../../../../app/(dashboard)/search/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/modules/search', async () => {
  const actual = await vi.importActual<typeof import('@/modules/search')>('@/modules/search');
  return {
    ...actual,
    useGlobalSearch: () => ({ isLoading: false, isError: false, data: { total: 0, hits: [] }, refetch: vi.fn() }),
    useSavedSearches: () => ({ isLoading: false, data: [] }),
    useRecentSearches: () => ({ isLoading: false, data: [] }),
    useSaveSearch: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteSavedSearch: () => ({ mutate: vi.fn() }),
    useClearRecentSearches: () => ({ mutate: vi.fn() }),
  };
});

describe('Global search page', () => {
  it('renders the search shell', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SearchPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Global Search')).toBeTruthy();
  });
});
