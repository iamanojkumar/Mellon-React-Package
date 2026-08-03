import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ToolTraceViewer } from './ToolTraceViewer';
import type { ToolTraceStep } from './ToolTraceViewer';

const STEPS: ToolTraceStep[] = [
  { id: '1', label: 'Searching the web…', status: 'done', detail: 'flexbox centering' },
  { id: '2', label: 'Reading 3 pages…', status: 'active' },
  { id: '3', label: 'Drafting a response', status: 'pending' },
];

describe('ToolTraceViewer', () => {
  it('renders as an ordered list', () => {
    render(<ToolTraceViewer steps={STEPS} data-testid="trace" />);
    expect(screen.getByTestId('trace').tagName).toBe('OL');
  });

  it('renders one item per step, in order', () => {
    render(<ToolTraceViewer steps={STEPS} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Searching the web…');
    expect(items[1]).toHaveTextContent('Reading 3 pages…');
    expect(items[2]).toHaveTextContent('Drafting a response');
  });

  it('renders the optional detail text', () => {
    render(<ToolTraceViewer steps={STEPS} />);
    expect(screen.getByText('flexbox centering')).toBeInTheDocument();
  });

  it('marks the active step with data-status and aria-current="step"', () => {
    render(<ToolTraceViewer steps={STEPS} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('data-status', 'active');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLOListElement>();
    render(<ToolTraceViewer ref={ref} steps={STEPS} />);
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it('merges a custom className with the base style', () => {
    render(<ToolTraceViewer steps={STEPS} className="custom" data-testid="trace" />);
    expect(screen.getByTestId('trace').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ToolTraceViewer steps={STEPS} />);
    await expectNoA11yViolations(container);
  });
});
