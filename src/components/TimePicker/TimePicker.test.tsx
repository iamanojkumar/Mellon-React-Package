import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders a combobox trigger', () => {
    render(<TimePicker aria-label="Time" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TimePicker aria-label="Time" />);
    await expectNoA11yViolations(container);
  });

  it('generates 12-hour labels by default', async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="Time" min="09:00" max="10:00" step={30} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: '9:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '9:30 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '10:00 AM' })).toBeInTheDocument();
  });

  it('generates 24-hour labels when use12Hour is false', async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="Time" min="13:00" max="14:00" step={30} use12Hour={false} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: '13:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '13:30' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '14:00' })).toBeInTheDocument();
  });

  it('respects a custom step', async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="Time" min="09:00" max="10:00" step={15} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(5); // 09:00, 09:15, 09:30, 09:45, 10:00
  });

  it('stores the value as a 24-hour HH:MM string regardless of use12Hour', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TimePicker aria-label="Time" min="13:00" max="14:00" step={30} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '1:30 PM' }));
    expect(onChange).toHaveBeenCalledWith('13:30');
  });

  it('shows the selected time label in the trigger', () => {
    render(<TimePicker aria-label="Time" defaultValue="09:30" min="09:00" max="10:00" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('9:30 AM');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<TimePicker aria-label="Time" disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  describe('aiSuggest', () => {
    it('inherits aiSuggest from Select (thin pass-through, not reimplemented)', async () => {
      const user = userEvent.setup();
      const resolve = vi.fn().mockResolvedValue('09:30');
      render(
        <TimePicker aria-label="Time" min="09:00" max="10:00" step={30} aiSuggest={{ resolve }} />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      expect(resolve).toHaveBeenCalled();
      expect(screen.getByRole('combobox')).toHaveTextContent('9:30 AM');
    });
  });
});
