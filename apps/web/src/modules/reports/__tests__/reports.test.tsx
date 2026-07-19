import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportsDashboardPage from '../../../../app/(dashboard)/reports/page';

describe('Reports dashboard page', () => {
  it('renders the reporting builder shell', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ReportsDashboardPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Reports & Exports')).toBeTruthy();
    expect(screen.getByText('Report builder')).toBeTruthy();
  });
});
