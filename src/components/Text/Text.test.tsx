import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Text } from './Text';

describe('Text', () => {
  it('renders as a span by default', () => {
    render(<Text data-testid="text">content</Text>);
    expect(screen.getByTestId('text').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Text as="section" data-testid="text" />);
    expect(screen.getByTestId('text').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Text ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Text data-testid="text" className="custom" />);
    expect(screen.getByTestId('text').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Text>content</Text>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md, weight=regular, color=primary', () => {
    render(<Text data-testid="text">content</Text>);
    const el = screen.getByTestId('text');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-weight', 'regular');
    expect(el).toHaveAttribute('data-color', 'primary');
  });

  it('applies size, weight, and color as data attributes', () => {
    render(
      <Text data-testid="text" size="lg" weight="bold" color="danger">
        content
      </Text>,
    );
    const el = screen.getByTestId('text');
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-weight', 'bold');
    expect(el).toHaveAttribute('data-color', 'danger');
  });

  it('omits the data-truncate attribute when truncate is false', () => {
    render(<Text data-testid="text">content</Text>);
    expect(screen.getByTestId('text')).not.toHaveAttribute('data-truncate');
  });

  it('sets data-truncate="true" when truncate is enabled', () => {
    render(
      <Text data-testid="text" truncate>
        content
      </Text>,
    );
    expect(screen.getByTestId('text')).toHaveAttribute('data-truncate', 'true');
  });
});
