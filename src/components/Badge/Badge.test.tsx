import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders as a span by default', () => {
    render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId('badge').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Badge as="div" data-testid="badge" />);
    expect(screen.getByTestId('badge').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Badge data-testid="badge" className="custom" />);
    expect(screen.getByTestId('badge').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge>New</Badge>);
    await expectNoA11yViolations(container);
  });

  it('defaults to color=neutral and variant=subtle', () => {
    render(<Badge data-testid="badge">New</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toHaveAttribute('data-color', 'neutral');
    expect(el).toHaveAttribute('data-variant', 'subtle');
  });

  it('applies the color and variant props as data attributes', () => {
    render(
      <Badge data-testid="badge" color="danger" variant="solid">
        Error
      </Badge>,
    );
    const el = screen.getByTestId('badge');
    expect(el).toHaveAttribute('data-color', 'danger');
    expect(el).toHaveAttribute('data-variant', 'solid');
  });

  // Status color must never be the only channel: red and green are the same
  // color under deuteranopia, and screen readers get no color at all.
  describe('secondary encoding for status colors', () => {
    it.each(['success', 'warning', 'danger'] as const)(
      'pairs color=%s with a visible glyph and a screen-reader label',
      (color) => {
        render(
          <Badge data-testid="badge" color={color}>
            3
          </Badge>,
        );
        const el = screen.getByTestId('badge');
        expect(el.querySelector('svg')).toBeInTheDocument();
        expect(el).toHaveAttribute('data-has-icon');
        expect(el).toHaveTextContent(color);
      },
    );

    it.each(['neutral', 'brand'] as const)('adds no glyph for presentational color=%s', (color) => {
      render(
        <Badge data-testid="badge" color={color}>
          3
        </Badge>,
      );
      const el = screen.getByTestId('badge');
      expect(el.querySelector('svg')).not.toBeInTheDocument();
      expect(el).not.toHaveAttribute('data-has-icon');
      expect(el).toHaveTextContent('3');
    });

    it('lets a caller supply its own glyph', () => {
      render(
        <Badge data-testid="badge" color="danger" icon={<span data-testid="custom">!</span>}>
          Error
        </Badge>,
      );
      expect(screen.getByTestId('custom')).toBeInTheDocument();
      expect(screen.getByTestId('badge').querySelector('svg')).not.toBeInTheDocument();
    });

    it('suppresses both channels with icon={false}, for labels that name the status themselves', () => {
      render(
        <Badge data-testid="badge" color="danger" icon={false}>
          Failed
        </Badge>,
      );
      const el = screen.getByTestId('badge');
      expect(el.querySelector('svg')).not.toBeInTheDocument();
      expect(el).toHaveTextContent('Failed');
      expect(el).not.toHaveTextContent('danger');
    });

    it('has no accessibility violations with a status color', async () => {
      const { container } = render(<Badge color="success">3</Badge>);
      await expectNoA11yViolations(container);
    });
  });
});
