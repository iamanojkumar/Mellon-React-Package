import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Combobox } from './Combobox';
import type { ComboboxOption } from './Combobox';

const FRUITS: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
  { value: 'grape', label: 'Grape' },
];

describe('Combobox', () => {
  it('renders a combobox text input', () => {
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('has no accessibility violations, closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Combobox aria-label="Fruit" options={FRUITS} />);
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });

  it('shows the full option list on focus, unfiltered', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('filters options as the user types, keeping focus in the input', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox');
    // "app" matches only Apple — "ap" would also match "grape" (gr-ap-e).
    await user.type(input, 'app');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('shows the no-results message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('highlights options via aria-activedescendant on ArrowDown, without moving real focus', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    const apple = screen.getByRole('option', { name: 'Apple' });
    expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    expect(input).toHaveFocus();
  });

  it('skips disabled options when moving with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    // Apple -> Banana -> (Cherry is disabled, skipped) -> Date
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    const date = screen.getByRole('option', { name: 'Date' });
    expect(input).toHaveAttribute('aria-activedescendant', date.id);
  });

  it('selects the highlighted option with Enter and closes the panel', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input.value).toBe('Apple');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects an option by click without blurring the input first', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(input.value).toBe('Banana');
    expect(input).toHaveFocus();
  });

  it('calls onChange with the selected value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Grape' }));
    expect(onChange).toHaveBeenCalledWith('grape');
  });

  it('reverts the typed text on blur when nothing was selected (allowFreeText=false)', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox aria-label="Fruit" options={FRUITS} defaultValue="apple" />
        <button type="button">elsewhere</button>
      </div>,
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'xyz');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(input.value).toBe('Apple');
  });

  it('reverts to empty on blur when nothing was ever selected', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox aria-label="Fruit" options={FRUITS} />
        <button type="button">elsewhere</button>
      </div>,
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'xyz');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(input.value).toBe('');
  });

  it('closes on Escape and reverts the text', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={FRUITS} defaultValue="banana" />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'xyz');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input.value).toBe('Banana');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('apple');
      return <Combobox aria-label="Fruit" options={FRUITS} value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('Apple');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Date' }));
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('Date');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Combobox aria-label="Fruit" options={FRUITS} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
