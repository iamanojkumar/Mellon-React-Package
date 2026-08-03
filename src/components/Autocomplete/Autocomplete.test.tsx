import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Autocomplete } from './Autocomplete';
import type { ComboboxOption } from './Autocomplete';

const CITIES: ComboboxOption[] = [
  { value: 'nyc', label: 'New York City' },
  { value: 'la', label: 'Los Angeles' },
  { value: 'chi', label: 'Chicago' },
];

describe('Autocomplete', () => {
  it('renders a combobox text input', () => {
    render(<Autocomplete aria-label="City" options={CITIES} />);
    expect(screen.getByRole('combobox')).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Autocomplete aria-label="City" options={CITIES} />);
    await expectNoA11yViolations(container);
  });

  it('treats typed text as the value immediately, even without a matching option', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Autocomplete aria-label="City" options={CITIES} onChange={onChange} />);
    await user.type(screen.getByRole('combobox'), 'Springfield');
    expect(onChange).toHaveBeenLastCalledWith('Springfield');
  });

  it('does not revert the typed text on blur (unlike Combobox)', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Autocomplete aria-label="City" options={CITIES} />
        <button type="button">elsewhere</button>
      </div>,
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'Springfield');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(input.value).toBe('Springfield');
  });

  it('still allows picking a suggested option by click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Autocomplete aria-label="City" options={CITIES} onChange={onChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Chicago' }));
    expect(input.value).toBe('Chicago');
    expect(onChange).toHaveBeenCalledWith('chi');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Autocomplete aria-label="City" options={CITIES} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  describe('aiSearch', () => {
    it('inherits aiSearch from Combobox (thin pass-through, not reimplemented)', async () => {
      const user = userEvent.setup();
      const resolve = vi.fn().mockResolvedValue([{ value: 'sea', label: 'Seattle' }]);
      render(<Autocomplete aria-label="City" options={CITIES} aiSearch={{ resolve }} />);
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'Search with AI' }));
      expect(resolve).toHaveBeenCalledWith('');
      expect(await screen.findByRole('option', { name: 'Seattle' })).toBeInTheDocument();
    });
  });
});
