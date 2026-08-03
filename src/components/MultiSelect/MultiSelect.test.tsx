import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MultiSelect } from './MultiSelect';
import type { SelectOption } from './MultiSelect';

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
];

describe('MultiSelect', () => {
  it('renders a combobox trigger showing the placeholder when nothing is selected', () => {
    render(<MultiSelect aria-label="Fruits" options={FRUITS} placeholder="Pick fruits" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick fruits');
  });

  it('has no accessibility violations, closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(document.body);
  });

  it('sets aria-multiselectable on the listbox', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('toggles an option in and stays open', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles an option back out on a second click', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} defaultValue={['apple']} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false');
  });

  it('joins up to summarizeAfter labels in the trigger', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple, Banana');
  });

  it('summarizes as "N selected" beyond summarizeAfter', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} summarizeAfter={1} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('2 selected');
  });

  it('does not toggle a disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with the full updated array', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChange).toHaveBeenCalledWith(['apple']);
    await user.click(screen.getByRole('option', { name: 'Date' }));
    expect(onChange).toHaveBeenCalledWith(['apple', 'date']);
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>([]);
      return <MultiSelect aria-label="Fruits" options={FRUITS} value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  it('toggles the focused option with Enter', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<MultiSelect aria-label="Fruits" options={FRUITS} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  describe('aiSuggest', () => {
    it('renders no AI trigger when aiSuggest is omitted', async () => {
      const user = userEvent.setup();
      render(<MultiSelect aria-label="Fruits" options={FRUITS} />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.queryByRole('button', { name: 'Suggest with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when aiSuggest is passed', async () => {
      const user = userEvent.setup();
      render(<MultiSelect aria-label="Fruits" options={FRUITS} aiSuggest={{ resolve: vi.fn() }} />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('button', { name: 'Suggest with AI' })).toBeInTheDocument();
    });

    it('merges resolved values into the existing selection', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const resolve = vi.fn().mockResolvedValue(['banana', 'date']);
      render(
        <MultiSelect
          aria-label="Fruits"
          options={FRUITS}
          defaultValue={['apple']}
          onChange={onChange}
          aiSuggest={{ resolve }}
        />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      expect(resolve).toHaveBeenCalledWith(FRUITS);
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['apple', 'banana', 'date'])),
      );
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('ignores resolved values that match a disabled option', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const resolve = vi.fn().mockResolvedValue(['cherry']);
      render(
        <MultiSelect
          aria-label="Fruits"
          options={FRUITS}
          onChange={onChange}
          aiSuggest={{ resolve }}
        />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      await waitFor(() => expect(resolve).toHaveBeenCalled());
      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows an inline error when resolve rejects', async () => {
      const user = userEvent.setup();
      const resolve = vi.fn().mockRejectedValue(new Error('nope'));
      render(<MultiSelect aria-label="Fruits" options={FRUITS} aiSuggest={{ resolve }} />);
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't get a suggestion.");
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const user = userEvent.setup();
      render(<MultiSelect aria-label="Fruits" options={FRUITS} aiSuggest={{ resolve: vi.fn() }} />);
      await user.click(screen.getByRole('combobox'));
      await expectNoA11yViolations(document.body);
    });
  });
});
