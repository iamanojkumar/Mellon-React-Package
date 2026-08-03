import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MemoryEditor } from './MemoryEditor';
import type { Memory } from './MemoryEditor';

const MEMORIES: Memory[] = [
  { id: '1', text: 'Prefers dark mode' },
  { id: '2', text: 'Works primarily in TypeScript' },
];

describe('MemoryEditor', () => {
  it('renders one MemoryListItem per memory', () => {
    render(<MemoryEditor memories={MEMORIES} onForget={() => {}} onAdd={() => {}} />);
    expect(screen.getByText('Prefers dark mode')).toBeInTheDocument();
    expect(screen.getByText('Works primarily in TypeScript')).toBeInTheDocument();
  });

  it('renders emptyLabel when there are no memories', () => {
    render(
      <MemoryEditor
        memories={[]}
        onForget={() => {}}
        onAdd={() => {}}
        emptyLabel="Nothing saved yet"
      />,
    );
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
  });

  it("clicking a memory item's forget button calls onForget with its id", async () => {
    const onForget = vi.fn();
    const user = userEvent.setup();
    render(<MemoryEditor memories={MEMORIES} onForget={onForget} onAdd={() => {}} />);
    const buttons = screen.getAllByRole('button', { name: 'Forget' });
    await user.click(buttons[0]!);
    expect(onForget).toHaveBeenCalledWith('1');
  });

  it('the Add button is disabled while the draft is empty', () => {
    render(<MemoryEditor memories={[]} onForget={() => {}} onAdd={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('typing and submitting adds a memory and clears the draft', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MemoryEditor memories={[]} onForget={() => {}} onAdd={onAdd} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Timezone: America/Los_Angeles');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith('Timezone: America/Los_Angeles');
    expect(input).toHaveValue('');
  });

  it('submitting via Enter also adds the memory', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MemoryEditor memories={[]} onForget={() => {}} onAdd={onAdd} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Timezone: America/Los_Angeles{Enter}');
    expect(onAdd).toHaveBeenCalledWith('Timezone: America/Los_Angeles');
  });

  it('does not call onAdd for a whitespace-only draft', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MemoryEditor memories={[]} onForget={() => {}} onAdd={onAdd} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '   {Enter}');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('supports a custom placeholder and addLabel', () => {
    render(
      <MemoryEditor
        memories={[]}
        onForget={() => {}}
        onAdd={() => {}}
        placeholder="Remember something…"
        addLabel="Save"
      />,
    );
    expect(screen.getByPlaceholderText('Remember something…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('merges a custom className with the base style', () => {
    render(<MemoryEditor memories={[]} onForget={() => {}} onAdd={() => {}} className="custom" />);
    expect(document.querySelector('.custom')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryEditor memories={MEMORIES} onForget={() => {}} onAdd={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });
});
