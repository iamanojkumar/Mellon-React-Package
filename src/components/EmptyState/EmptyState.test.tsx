import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders as a div', () => {
    render(<EmptyState data-testid="empty" title="No results" />);
    expect(screen.getByTestId('empty').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<EmptyState ref={ref} title="No results" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<EmptyState data-testid="empty" className="custom" title="No results" />);
    expect(screen.getByTestId('empty').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <EmptyState
        icon={<span>📭</span>}
        title="No results"
        description="Try a different search"
        action={<button type="button">Clear filters</button>}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('renders the title', () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('does not render description/action/icon when not given', () => {
    render(<EmptyState title="No results" data-testid="empty" />);
    expect(screen.getByTestId('empty').children).toHaveLength(1);
  });

  it('renders description and action when given', () => {
    render(
      <EmptyState
        title="No results"
        description="Try a different search"
        action={<button type="button">Clear filters</button>}
      />,
    );
    expect(screen.getByText('Try a different search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('hides the icon from assistive tech', () => {
    render(<EmptyState title="No results" icon={<span data-testid="icon">📭</span>} />);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
