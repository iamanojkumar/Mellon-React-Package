import { describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MentionPicker } from './MentionPicker';
import type { FloatingListPickerHandle, MentionOption } from './MentionPicker';

const OPTIONS: MentionOption[] = [
  { id: '1', name: 'Alex Chen' },
  { id: '2', name: 'Jordan Lee' },
  { id: '3', name: 'Sam Rivera', disabled: true },
];

/** Wires MentionPicker to a real `<textarea>` the way a composer would — the host owns keydown and delegates to the exposed handle. */
function Demo() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<MentionOption | null>(null);
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
      <MentionPicker
        ref={handleRef}
        open={open}
        anchorPoint={{ x: 10, y: 20 }}
        options={OPTIONS}
        onSelect={(option) => {
          setSelected(option);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
      {selected && <div data-testid="selected">{selected.name}</div>}
    </div>
  );
}

describe('MentionPicker', () => {
  it('renders nothing when closed', () => {
    render(
      <MentionPicker
        open={false}
        anchorPoint={{ x: 0, y: 0 }}
        options={OPTIONS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders an option per entry with role=listbox/option', () => {
    render(
      <MentionPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        options={OPTIONS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders emptyLabel when there are no options', () => {
    render(
      <MentionPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        options={[]}
        onSelect={() => {}}
        onClose={() => {}}
        emptyLabel="No people found"
      />,
    );
    expect(screen.getByText('No people found')).toBeInTheDocument();
  });

  it('clicking an option calls onSelect', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <MentionPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        options={OPTIONS}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByText('Alex Chen'));
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[0]);
  });

  it('integrates with a host textarea: ArrowDown then Enter selects the second option', () => {
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
    expect(screen.getByTestId('selected')).toHaveTextContent('Jordan Lee');
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
      <MentionPicker
        open
        anchorPoint={{ x: 0, y: 0 }}
        options={OPTIONS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('exposes handleKeyDown via the forwarded ref, usable directly outside a real event', () => {
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    render(
      <MentionPicker
        ref={handle}
        open
        anchorPoint={{ x: 0, y: 0 }}
        options={OPTIONS}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    act(() => {
      expect(handle.current!.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} })).toBe(
        true,
      );
    });
  });
});
