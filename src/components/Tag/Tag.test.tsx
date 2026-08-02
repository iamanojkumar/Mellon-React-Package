import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders as a span by default', () => {
    render(<Tag data-testid="tag">design-system</Tag>);
    expect(screen.getByTestId('tag').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(
      <Tag as="a" href="/tags/react" data-testid="tag">
        react
      </Tag>,
    );
    expect(screen.getByTestId('tag').tagName).toBe('A');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref}>content</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <Tag data-testid="tag" className="custom">
        content
      </Tag>,
    );
    expect(screen.getByTestId('tag').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Tag>design-system</Tag>);
    await expectNoA11yViolations(container);
  });

  it('defaults to color=neutral', () => {
    render(<Tag data-testid="tag">content</Tag>);
    expect(screen.getByTestId('tag')).toHaveAttribute('data-color', 'neutral');
  });

  it('applies the color prop as a data attribute', () => {
    render(
      <Tag data-testid="tag" color="brand">
        content
      </Tag>,
    );
    expect(screen.getByTestId('tag')).toHaveAttribute('data-color', 'brand');
  });
});
