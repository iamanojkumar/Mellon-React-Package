import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders the semantic tag matching its level', () => {
    render(
      <Heading level={3} data-testid="heading">
        content
      </Heading>,
    );
    expect(screen.getByTestId('heading').tagName).toBe('H3');
  });

  it('renders as the element passed via the "as" prop, overriding the level default', () => {
    render(<Heading level={2} as="div" role="heading" aria-level={2} data-testid="heading" />);
    expect(screen.getByTestId('heading').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Heading level={1} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Heading level={1} data-testid="heading" className="custom" />);
    expect(screen.getByTestId('heading').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Heading level={1}>content</Heading>);
    await expectNoA11yViolations(container);
  });

  it('defaults size from level and weight to bold', () => {
    render(
      <Heading level={1} data-testid="heading">
        content
      </Heading>,
    );
    const el = screen.getByTestId('heading');
    expect(el).toHaveAttribute('data-size', 'xl');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it('lets the size prop override the level-derived default', () => {
    render(
      <Heading level={1} size="sm" data-testid="heading">
        content
      </Heading>,
    );
    expect(screen.getByTestId('heading')).toHaveAttribute('data-size', 'sm');
  });

  it.each([
    [1, 'xl'],
    [2, 'lg'],
    [3, 'md'],
    [4, 'md'],
    [5, 'sm'],
    [6, 'xs'],
  ] as const)('level %i defaults to size %s', (level, size) => {
    render(
      <Heading level={level} data-testid="heading">
        content
      </Heading>,
    );
    expect(screen.getByTestId('heading')).toHaveAttribute('data-size', size);
  });
});
