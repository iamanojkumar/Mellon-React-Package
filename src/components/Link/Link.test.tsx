import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Link } from './Link';

describe('Link', () => {
  it('renders as an anchor by default', () => {
    render(
      <Link href="/docs" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId('link').tagName).toBe('A');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Link as="button" data-testid="link" />);
    expect(screen.getByTestId('link').tagName).toBe('BUTTON');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Link ref={ref} href="/docs" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <Link href="/docs" data-testid="link" className="custom">
        Docs
      </Link>,
    );
    expect(screen.getByTestId('link').className).toContain('custom');
  });

  it('passes through native anchor attributes such as href', () => {
    render(<Link href="/docs">Docs</Link>);
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Link href="/docs">Docs</Link>);
    await expectNoA11yViolations(container);
  });

  it('defaults to color=brand', () => {
    render(
      <Link href="/docs" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId('link')).toHaveAttribute('data-color', 'brand');
  });
});
