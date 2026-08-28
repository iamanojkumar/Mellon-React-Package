import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasToolbar } from './CanvasToolbar';

describe('CanvasToolbar', () => {
  it('is a labelled toolbar', () => {
    render(<CanvasToolbar onInsert={vi.fn()} />);
    expect(screen.getByRole('toolbar', { name: 'Add to canvas' })).toBeInTheDocument();
  });

  it('reports the right kind for each button', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<CanvasToolbar onInsert={onInsert} />);

    await user.click(screen.getByRole('button', { name: 'Add sticky note' }));
    await user.click(screen.getByRole('button', { name: 'Add rectangle' }));
    await user.click(screen.getByRole('button', { name: 'Add pill' }));
    await user.click(screen.getByRole('button', { name: 'Add diamond' }));
    await user.click(screen.getByRole('button', { name: 'Add node' }));
    await user.click(screen.getByRole('button', { name: 'Add frame' }));

    expect(onInsert.mock.calls.map((call) => call[0])).toEqual([
      'sticky',
      'shape-rectangle',
      'shape-ellipse',
      'shape-diamond',
      'node',
      'frame',
    ]);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasToolbar onInsert={vi.fn()} />);
    await expectNoA11yViolations(container);
  });
});
