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

  // See Badge's equivalent block — status color is never the only channel.
  describe('secondary encoding for status colors', () => {
    it.each(['success', 'warning', 'danger'] as const)(
      'pairs color=%s with a visible glyph and a screen-reader label',
      (color) => {
        render(
          <Tag data-testid="tag" color={color}>
            build
          </Tag>,
        );
        const el = screen.getByTestId('tag');
        expect(el.querySelector('svg')).toBeInTheDocument();
        expect(el).toHaveAttribute('data-has-icon');
        expect(el).toHaveTextContent(color);
      },
    );

    it.each(['neutral', 'brand'] as const)('adds no glyph for presentational color=%s', (color) => {
      render(
        <Tag data-testid="tag" color={color}>
          build
        </Tag>,
      );
      const el = screen.getByTestId('tag');
      expect(el.querySelector('svg')).not.toBeInTheDocument();
      expect(el).not.toHaveAttribute('data-has-icon');
    });

    it('suppresses both channels with icon={false}', () => {
      render(
        <Tag data-testid="tag" color="danger" icon={false}>
          Failed
        </Tag>,
      );
      const el = screen.getByTestId('tag');
      expect(el.querySelector('svg')).not.toBeInTheDocument();
      expect(el).not.toHaveTextContent('danger');
    });

    it('has no accessibility violations with a status color', async () => {
      const { container } = render(<Tag color="warning">build</Tag>);
      await expectNoA11yViolations(container);
    });
  });
});
