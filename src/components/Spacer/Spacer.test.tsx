import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('renders as a div by default', () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId('spacer').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Spacer as="span" data-testid="spacer" />);
    expect(screen.getByTestId('spacer').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spacer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Spacer data-testid="spacer" className="custom" />);
    expect(screen.getByTestId('spacer').className).toContain('custom');
  });

  it('is hidden from assistive tech, since it carries no content', () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId('spacer')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Spacer />);
    await expectNoA11yViolations(container);
  });

  it('defaults to flex: 1 1 0% when no size is given', () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId('spacer')).toHaveStyle({ flex: '1 1 0%' });
  });

  it('resolves a fixed size to width/height and flex: 0 0 auto', () => {
    render(<Spacer data-testid="spacer" size="md" />);
    const spacer = screen.getByTestId('spacer');
    expect(spacer).toHaveStyle({
      flex: '0 0 auto',
      width: 'var(--ds-space-md)',
      height: 'var(--ds-space-md)',
    });
  });
});
