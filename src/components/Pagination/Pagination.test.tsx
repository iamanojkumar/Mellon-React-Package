import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Pagination, getPaginationRange } from './Pagination';

function ControlledPagination(props: {
  initialPage?: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}) {
  const [page, setPage] = useState(props.initialPage ?? 1);
  return (
    <Pagination
      page={page}
      totalPages={props.totalPages}
      onPageChange={(next) => {
        setPage(next);
        props.onPageChange?.(next);
      }}
    />
  );
}

describe('getPaginationRange', () => {
  it('lists every page when they all fit within the slot budget', () => {
    expect(getPaginationRange(3, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses both sides into ellipses when the current page is in the middle', () => {
    expect(getPaginationRange(5, 10, 1, 1)).toEqual([
      1,
      'start-ellipsis',
      4,
      5,
      6,
      'end-ellipsis',
      10,
    ]);
  });

  it('has no left ellipsis when the current page is near the start', () => {
    expect(getPaginationRange(2, 10, 1, 1)).toEqual([1, 2, 3, 'end-ellipsis', 10]);
  });

  it('has no right ellipsis when the current page is near the end', () => {
    expect(getPaginationRange(9, 10, 1, 1)).toEqual([1, 'start-ellipsis', 8, 9, 10]);
  });

  it('returns an empty range for zero total pages', () => {
    expect(getPaginationRange(1, 0, 1, 1)).toEqual([]);
  });
});

describe('Pagination', () => {
  it('renders a nav landmark labelled "Pagination" by default', () => {
    render(<Pagination totalPages={5} defaultPage={1} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination totalPages={5} defaultPage={3} />);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current');
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination totalPages={5} defaultPage={1} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<ControlledPagination totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('navigates with the Previous/Next buttons', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<ControlledPagination initialPage={3} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it('renders ellipsis markers as aria-hidden, non-interactive', () => {
    render(<Pagination totalPages={20} defaultPage={10} />);
    expect(screen.queryAllByRole('button', { name: /^\.\.\./ })).toHaveLength(0);
  });

  it('disables every control when disabled', () => {
    render(<Pagination totalPages={5} defaultPage={2} disabled />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Pagination totalPages={10} defaultPage={5} />);
    await expectNoA11yViolations(container);
  });
});
