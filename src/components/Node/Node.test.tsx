import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Node } from './Node';

describe('Node', () => {
  it('is a labelled group named by its name', () => {
    render(<Node id="n1" name="Prompt" />);

    expect(screen.getByRole('group', { name: 'Prompt' })).toBeInTheDocument();
  });

  it('renders its held content in the body', () => {
    render(
      <Node id="n1" name="Prompt">
        <p>Held content</p>
      </Node>,
    );

    expect(screen.getByText('Held content')).toBeInTheDocument();
  });

  it('carries selected as a data attribute', () => {
    const { container } = render(<Node id="n1" name="Prompt" selected />);

    expect(container.firstElementChild).toHaveAttribute('data-selected', '');
  });

  it('reports pointerdown as a selection, forwarding shiftKey as additive', () => {
    const onSelect = vi.fn();
    render(<Node id="n1" name="Prompt" onSelect={onSelect} />);

    // jsdom has no real PointerEvent constructor, so shiftKey is carried via
    // a MouseEvent typed 'pointerdown' rather than `fireEvent.pointerDown`.
    fireEvent(
      screen.getByRole('group', { name: 'Prompt' }),
      new MouseEvent('pointerdown', { bubbles: true, shiftKey: true }),
    );

    expect(onSelect).toHaveBeenCalledWith('n1', true);
  });

  it('renders no input port when hasInput is false, and no output port when hasOutput is false', () => {
    render(<Node id="n1" name="Sink" hasOutput={false} onInputPortClick={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /output/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /input/i })).toBeInTheDocument();
  });

  it('renders a port as an inert, non-interactive span without a click handler', () => {
    render(<Node id="n1" name="Sink" />);
    expect(screen.queryByRole('button', { name: /input/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /output/i })).not.toBeInTheDocument();
  });

  it('reports clicking the output port without also selecting the node', () => {
    const onOutputPortClick = vi.fn();
    const onSelect = vi.fn();
    render(
      <Node id="n1" name="Prompt" onOutputPortClick={onOutputPortClick} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /output/i }));

    expect(onOutputPortClick).toHaveBeenCalledWith('n1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reports clicking the input port', () => {
    const onInputPortClick = vi.fn();
    render(<Node id="n1" name="Prompt" onInputPortClick={onInputPortClick} />);

    fireEvent.click(screen.getByRole('button', { name: /input/i }));

    expect(onInputPortClick).toHaveBeenCalledWith('n1');
  });

  it('stays a static label without onRename', () => {
    render(<Node id="n1" name="Prompt" />);

    fireEvent.doubleClick(screen.getByText('Prompt'));

    expect(screen.queryByLabelText('Node name')).not.toBeInTheDocument();
  });

  it('renaming: double-click swaps to an input, Enter commits the trimmed value', () => {
    const onRename = vi.fn();
    render(<Node id="n1" name="Prompt" onRename={onRename} />);

    fireEvent.doubleClick(screen.getByText('Prompt'));
    const input = screen.getByLabelText('Node name');
    fireEvent.change(input, { target: { value: '  Renamed  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('Renamed');
    expect(screen.queryByLabelText('Node name')).not.toBeInTheDocument();
  });

  it('renaming: Escape discards the draft without calling onRename', () => {
    const onRename = vi.fn();
    render(<Node id="n1" name="Prompt" onRename={onRename} />);

    fireEvent.doubleClick(screen.getByText('Prompt'));
    fireEvent.change(screen.getByLabelText('Node name'), { target: { value: 'Discarded' } });
    fireEvent.keyDown(screen.getByLabelText('Node name'), { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Prompt')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Node id="n1" name="Prompt" onRename={vi.fn()} />);

    await expectNoA11yViolations(container);
  });
});
