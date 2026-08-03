import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { StatusLine } from './StatusLine';

describe('StatusLine', () => {
  it('renders the status text', () => {
    render(<StatusLine>Searching the web…</StatusLine>);
    expect(screen.getByText('Searching the web…')).toBeInTheDocument();
  });

  it('has role="status" with the text as its accessible content', () => {
    render(<StatusLine>Searching the web…</StatusLine>);
    expect(screen.getByRole('status')).toHaveTextContent('Searching the web…');
  });

  it('renders a default decorative icon', () => {
    render(<StatusLine data-testid="line">Searching…</StatusLine>);
    const icon = screen.getByTestId('line').querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('supports a custom icon', () => {
    render(<StatusLine icon={<span data-testid="custom-icon" />}>Searching…</StatusLine>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<StatusLine ref={ref}>Searching…</StatusLine>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <StatusLine className="custom" data-testid="line">
        Searching…
      </StatusLine>,
    );
    expect(screen.getByTestId('line').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StatusLine>Searching the web…</StatusLine>);
    await expectNoA11yViolations(container);
  });
});
