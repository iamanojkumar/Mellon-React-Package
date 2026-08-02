import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Select } from './Select';
import type { SelectOption } from './Select';

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
];

describe('Select', () => {
  it('renders a combobox trigger showing the placeholder when nothing is selected', () => {
    render(<Select aria-label="Fruit" options={FRUITS} placeholder="Pick a fruit" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a fruit');
  });

  it('shows the selected option label from defaultValue', () => {
    render(<Select aria-label="Fruit" options={FRUITS} defaultValue="banana" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  it('has the right combobox ARIA wiring', () => {
    render(<Select aria-label="Fruit" options={FRUITS} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility violations, closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Fruit" options={FRUITS} />);
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });

  it('opens a listbox on click, focused on the first enabled option', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveFocus();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens focused on the currently-selected option, not the first', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} defaultValue="date" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Date' })).toHaveFocus();
  });

  it('marks the selected option aria-selected', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} defaultValue="banana" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false');
  });

  it('disabled options are marked aria-disabled and skipped by roving focus', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-disabled', 'true');
    // ArrowDown from Apple should skip disabled Cherry and land on... Banana first.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();
  });

  it('selects an option by click, closes the listbox, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('selects an option with Enter', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  it('does not select a disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select aria-label="Fruit" options={FRUITS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    // Cherry is rendered but excluded from the itemSelector/click-select path.
    const cherry = screen.getByRole('option', { name: 'Cherry' });
    await user.click(cherry);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('calls onChange with the selected value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('apple');
      return <Select aria-label="Fruit" options={FRUITS} value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Date' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Date');
  });

  it('closes on Escape without changing the selection', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Fruit" options={FRUITS} defaultValue="apple" />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Select aria-label="Fruit" options={FRUITS} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
