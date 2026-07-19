import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsDashboard from '../../../../app/(dashboard)/analytics/page';

vi.mock('@/modules/analytics/store.js', async () => {
  const actual = await vi.importActual<typeof import('@/modules/analytics/store.js')>('@/modules/analytics/store.js');
  return {
    ...actual,
    useKpis: () => ({ data: { openCases: 4, closedCases: 6, escalatedCases: 2 }, isLoading: false }),
    useCaseAnalytics: () => ({ data: undefined, isLoading: false }),
    useEscalationAnalytics: () => ({ data: undefined }),
    useTrends: () => ({ data: [] }),
    useHeatmap: () => ({ data: [] }),
    useCommunicationAnalytics: () => ({ data: [] }),
  };
});

describe('Analytics dashboard page', () => {
  it('renders the analytics dashboard header', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AnalyticsDashboard />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Analytics')).toBeTruthy();
  });
});
