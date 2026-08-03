import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CitationCard } from './CitationCard';

describe('CitationCard', () => {
  it('renders the title', () => {
    render(<CitationCard title="MDN Web Docs" />);
    expect(screen.getByText('MDN Web Docs')).toBeInTheDocument();
  });

  it('renders a plain div when no href is given', () => {
    render(<CitationCard title="MDN Web Docs" data-testid="card" />);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('renders an anchor when href is given', () => {
    render(<CitationCard title="MDN Web Docs" href="https://developer.mozilla.org" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://developer.mozilla.org');
  });

  it('renders the optional index, source, and snippet', () => {
    render(
      <CitationCard
        index={1}
        title="MDN Web Docs"
        source="developer.mozilla.org"
        snippet="Flexbox is a one-dimensional layout method."
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('developer.mozilla.org')).toBeInTheDocument();
    expect(screen.getByText('Flexbox is a one-dimensional layout method.')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CitationCard ref={ref} title="MDN Web Docs" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<CitationCard title="MDN Web Docs" className="custom" data-testid="card" />);
    expect(screen.getByTestId('card').className).toContain('custom');
  });

  it('has no accessibility violations, as a div or a link', async () => {
    const div = render(<CitationCard title="MDN Web Docs" />);
    await expectNoA11yViolations(div.container);
    div.unmount();
    const link = render(<CitationCard title="MDN Web Docs" href="https://developer.mozilla.org" />);
    await expectNoA11yViolations(link.container);
  });
});
