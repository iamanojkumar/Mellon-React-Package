import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CitationMarker } from './CitationMarker';

describe('CitationMarker', () => {
  it('renders the index as visible content', () => {
    render(<CitationMarker index={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders a non-interactive span when neither href nor onClick is given', () => {
    render(<CitationMarker index={1} data-testid="marker" />);
    expect(screen.getByTestId('marker').tagName).toBe('SPAN');
  });

  it('renders an anchor when href is given', () => {
    render(<CitationMarker index={1} href="#source-1" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#source-1');
  });

  it('renders a button and calls onClick when only onClick is given', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<CitationMarker index={1} onClick={onClick} />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('prefers href over onClick when both are given', () => {
    const onClick = vi.fn();
    render(<CitationMarker index={1} href="#source-1" onClick={onClick} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('defaults the accessible label to "Citation {index}"', () => {
    render(<CitationMarker index={2} />);
    expect(screen.getByLabelText('Citation 2')).toBeInTheDocument();
  });

  it('supports a custom accessible label', () => {
    render(<CitationMarker index={1} label="Source: MDN Web Docs" />);
    expect(screen.getByLabelText('Source: MDN Web Docs')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<CitationMarker ref={ref} index={1} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<CitationMarker index={1} className="custom" data-testid="marker" />);
    expect(screen.getByTestId('marker').className).toContain('custom');
  });

  it('has no accessibility violations in each render mode', async () => {
    const { container, rerender } = render(<CitationMarker index={1} />);
    await expectNoA11yViolations(container);
    rerender(<CitationMarker index={1} href="#source-1" />);
    await expectNoA11yViolations(container);
    rerender(<CitationMarker index={1} onClick={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
