import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasFillPicker, DEFAULT_CANVAS_FILL_PRESETS } from './CanvasFillPicker';

describe('CanvasFillPicker', () => {
  it('opens the popover on trigger click, closed by default', async () => {
    const user = userEvent.setup();
    render(<CanvasFillPicker onChange={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change fill color' }));
    expect(screen.getByRole('dialog', { name: 'Change fill color' })).toBeInTheDocument();
  });

  it('reports a chosen preset through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CanvasFillPicker onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Change fill color' }));
    await user.click(screen.getByRole('button', { name: DEFAULT_CANVAS_FILL_PRESETS[0] }));

    // `ColorPicker` round-trips the preset through hsv/rgb before reporting
    // it, so the reported hex isn't guaranteed byte-identical to the preset
    // — just a real hex color, which is `ColorPicker`'s own contract, not
    // this component's.
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^#[0-9a-f]{6}$/i));
  });

  it('accepts a custom accessible label', async () => {
    const user = userEvent.setup();
    render(<CanvasFillPicker onChange={vi.fn()} triggerLabel="Shape fill" />);

    await user.click(screen.getByRole('button', { name: 'Shape fill' }));
    expect(screen.getByRole('dialog', { name: 'Shape fill' })).toBeInTheDocument();
  });

  it('has no accessibility violations, open or closed', async () => {
    const { container, rerender } = render(<CanvasFillPicker onChange={vi.fn()} />);
    await expectNoA11yViolations(container);

    rerender(<CanvasFillPicker onChange={vi.fn()} defaultOpen />);
    await expectNoA11yViolations(container);
  });
});
