import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasOutline } from './CanvasOutline';
import type { CanvasScene } from '../../utilities/canvasReducer';

const scene: CanvasScene = {
  blocks: [
    { id: 'b', kind: 'sticky', text: 'Auth', x: 300, y: 0, width: 100, height: 100 },
    { id: 'a', kind: 'sticky', text: 'Login', x: 0, y: 0, width: 100, height: 100 },
  ],
  connectors: [{ id: 'e1', from: 'a', to: 'b' }],
};

describe('CanvasOutline', () => {
  it('is a labelled navigation region', () => {
    render(<CanvasOutline scene={scene} />);

    expect(screen.getByRole('navigation', { name: 'Canvas contents' })).toBeInTheDocument();
  });

  it('is present in the a11y tree even when not visible — it is the content', () => {
    render(<CanvasOutline scene={scene} />);

    // Clipped, not display:none — the latter would remove it from the tree.
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('lists blocks in reading order', () => {
    render(<CanvasOutline scene={scene} />);
    const entries = screen.getAllByRole('button').map((button) => button.textContent);

    expect(entries[0]).toContain('Login');
    expect(entries[1]).toContain('Auth');
  });

  it('names each block’s connections', () => {
    render(<CanvasOutline scene={scene} />);

    expect(screen.getByText('Connects to Auth')).toBeInTheDocument();
  });

  it('reports emptiness rather than rendering nothing', () => {
    render(<CanvasOutline scene={{ blocks: [], connectors: [] }} />);

    expect(screen.getByText('The canvas is empty.')).toBeInTheDocument();
  });

  it('marks the selected entry as current', () => {
    render(<CanvasOutline scene={scene} selectedIds={['a']} />);

    expect(screen.getByRole('button', { name: /Login/ })).toHaveAttribute('aria-current', 'true');
  });

  it('selects on activation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CanvasOutline scene={scene} onSelect={onSelect} />);

    // Scoped to the label itself: "Login" also matches /Auth/ via its own
    // "Connects to Auth" line.
    await user.click(screen.getByText('Auth').closest('button') as HTMLElement);

    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('has no accessibility violations in either presentation', async () => {
    const hidden = render(<CanvasOutline scene={scene} />);
    await expectNoA11yViolations(hidden.container);
    hidden.unmount();

    const visible = render(<CanvasOutline scene={scene} visible />);
    await expectNoA11yViolations(visible.container);
  });
});
