import { describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { SlashCommandPicker } from './SlashCommandPicker';
import type { FloatingListPickerHandle, SlashCommand } from './SlashCommandPicker';

const COMMANDS: SlashCommand[] = [
  { id: '1', label: '/summarize' },
  { id: '2', label: '/translate' },
  { id: '3', label: '/explain', disabled: true },
];

/** Wires SlashCommandPicker to a real `<textarea>` the way a composer would — the host owns keydown and delegates to the exposed handle. */
function Demo() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<SlashCommand | null>(null);
  const handleRef = useRef<FloatingListPickerHandle>(null);

  return (
    <div>
      <textarea
        aria-label="Composer"
        onKeyDown={(event) => {
          const handled = handleRef.current?.handleKeyDown(event);
          if (handled) event.preventDefault();
        }}
      />
      <SlashCommandPicker
        ref={handleRef}
        open={open}
        anchorPoint={{ x: 10, y: 20 }}
        commands={COMMANDS}
        onSelect={(command) => {
          setSelected(command);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
      {selected && <div data-testid="selected">{selected.label}</div>}
    </div>
  );
}

describe('SlashCommandPicker', () => {
  it('renders nothing when closed', () => {
    render(
      <SlashCommandPicker
        open={false}
        anchorPoint={{ x: 0, y: 0 }}
        commands={COMMANDS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders an option per command with role=listbox/option', () => {
    render(
      <SlashCommandPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        commands={COMMANDS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders emptyLabel when there are no commands', () => {
    render(
      <SlashCommandPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        commands={[]}
        onSelect={() => {}}
        onClose={() => {}}
        emptyLabel="No matching commands"
      />,
    );
    expect(screen.getByText('No matching commands')).toBeInTheDocument();
  });

  it('clicking a command calls onSelect', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SlashCommandPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        commands={COMMANDS}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByText('/summarize'));
    expect(onSelect).toHaveBeenCalledWith(COMMANDS[0]);
  });

  it('integrates with a host textarea: ArrowDown then Enter selects the second command', () => {
    render(<Demo />);
    const textarea = screen.getByRole('textbox', { name: 'Composer' });
    act(() => {
      fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    });
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('data-active');
    act(() => {
      fireEvent.keyDown(textarea, { key: 'Enter' });
    });
    expect(screen.getByTestId('selected')).toHaveTextContent('/translate');
  });

  it('Escape delegated from the host textarea closes the panel', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const textarea = screen.getByRole('textbox', { name: 'Composer' });
    await user.type(textarea, '{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SlashCommandPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        commands={COMMANDS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
