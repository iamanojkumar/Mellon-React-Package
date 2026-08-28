import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('swaps to a labelled input when editing', () => {
    render(<CanvasShape text="Draft" editing />);

    expect(screen.getByLabelText('Shape label')).toHaveValue('Draft');
  });

  it('focuses and selects the input while editing', () => {
    render(<CanvasShape text="Draft" editing />);
    const input = screen.getByLabelText('Shape label') as HTMLInputElement;

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Draft'.length);
  });

  it('reports every keystroke', () => {
    const onTextChange = vi.fn();
    render(<CanvasShape text="" editing onTextChange={onTextChange} />);

    fireEvent.change(screen.getByLabelText('Shape label'), { target: { value: 'a' } });

    expect(onTextChange).toHaveBeenCalledWith('a');
  });

  it('ends editing on Enter, Escape, and blur', () => {
    const onEditingEnd = vi.fn();
    render(<CanvasShape text="Draft" editing onEditingEnd={onEditingEnd} />);
    const input = screen.getByLabelText('Shape label');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEditingEnd).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onEditingEnd).toHaveBeenCalledTimes(2);

    fireEvent.blur(input);
    expect(onEditingEnd).toHaveBeenCalledTimes(3);
  });

  it('has no accessibility violations while editing', async () => {
    const { container } = render(<CanvasShape text="Draft" editing onTextChange={vi.fn()} />);

    await expectNoA11yViolations(container);
  });
});
