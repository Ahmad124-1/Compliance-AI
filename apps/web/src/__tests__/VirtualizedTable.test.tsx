import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualizedTable, type VColumn } from '@/components/ui/VirtualizedTable.js';

interface Row {
  id: string;
  name: string;
}

const columns: VColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name },
];

describe('VirtualizedTable', () => {
  it('renders empty state when no data', () => {
    render(<VirtualizedTable columns={columns} data={[]} rowKey={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders only a windowed slice of large datasets', () => {
    const data: Row[] = Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }));
    const { container } = render(<VirtualizedTable columns={columns} data={data} rowKey={(r) => r.id} height={200} rowHeight={40} />);
    const nameCells = Array.from(container.querySelectorAll('div')).filter((d) => /^Row \d+$/.test(d.textContent ?? ''));
    expect(nameCells.length).toBeLessThan(50);
    expect(nameCells.length).toBeGreaterThan(0);
  });

  it('invokes onRowClick when a row is clicked', () => {
    const data: Row[] = [{ id: 'r1', name: 'Row 1' }];
    let clicked: Row | null = null;
    render(<VirtualizedTable columns={columns} data={data} rowKey={(r) => r.id} onRowClick={(r: Row) => (clicked = r)} />);
    fireEvent.click(screen.getByText('Row 1'));
    expect(clicked!.id).toBe('r1');
  });
});
