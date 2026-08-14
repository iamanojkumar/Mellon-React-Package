import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasShape } from './CanvasShape';

describe('CanvasShape', () => {
  it('defaults to a rectangle', () => {
    const { container } = render(<CanvasShape />);

    expect(container.firstElementChild).toHaveAttribute('data-shape', 'rectangle');
  });

  it('exposes each shape as a data attribute for its clip-path', () => {
    for (const shape of ['ellipse', 'diamond', 'triangle', 'parallelogram'] as const) {
      const { container, unmount } = render(<CanvasShape shape={shape} />);
      expect(container.firstElementChild).toHaveAttribute('data-shape', shape);
      unmount();
    }
  });

  it('renders its label as real text, so it wraps and inherits type tokens', () => {
    render(<CanvasShape shape="diamond" text="Approved?" />);

    expect(screen.getByText('Approved?')).toBeInTheDocument();
  });

  it('renders no label element when there is no text', () => {
    const { container } = render(<CanvasShape shape="ellipse" />);

    expect(container.querySelector('span')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasShape shape="diamond" text="Decision" />);

    await expectNoA11yViolations(container);
  });
});
