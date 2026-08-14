import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasChecklist } from './CanvasChecklist';

const items = [
  { id: '1', text: 'Draft the brief', done: true },
  { id: '2', text: 'Book the room' },
  { id: '3', text: 'Send invites' },
];

describe('CanvasChecklist', () => {
  it('renders a checkbox per item, reflecting its state', () => {
    render(<CanvasChecklist items={items} onItemToggle={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Draft the brief' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Book the room' })).not.toBeChecked();
  });

  it('names the group with its progress, which the outline reads', () => {
    render(<CanvasChecklist items={items} title="Launch" onItemToggle={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Launch, 1 of 3 done' })).toBeInTheDocument();
  });

  it('reports a toggle rather than holding the state itself', async () => {
    const user = userEvent.setup();
    const onItemToggle = vi.fn();
    render(<CanvasChecklist items={items} onItemToggle={onItemToggle} />);

    await user.click(screen.getByRole('checkbox', { name: 'Book the room' }));

    expect(onItemToggle).toHaveBeenCalledWith('2', true);
    // Still unchecked: the owner applies the change, this only asks for it.
    expect(screen.getByRole('checkbox', { name: 'Book the room' })).not.toBeChecked();
  });

  it('disables the boxes with no handler, rather than faking interactivity', () => {
    render(<CanvasChecklist items={items} />);

    expect(screen.getByRole('checkbox', { name: 'Send invites' })).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CanvasChecklist items={items} title="Launch" onItemToggle={vi.fn()} />,
    );

    await expectNoA11yViolations(container);
  });
});
