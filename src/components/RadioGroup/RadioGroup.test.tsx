import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { RadioGroup } from './RadioGroup';

function BasicRadioGroup(props: { onValueChange?: (value: string) => void }) {
  return (
    <RadioGroup defaultValue="one" onValueChange={props.onValueChange}>
      <RadioGroup.Radio value="one">One</RadioGroup.Radio>
      <RadioGroup.Radio value="two">Two</RadioGroup.Radio>
      <RadioGroup.Radio value="three" disabled>
        Three
      </RadioGroup.Radio>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('checks defaultValue initially', () => {
    render(<BasicRadioGroup />);
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('aria-checked', 'false');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicRadioGroup />);
    await expectNoA11yViolations(container);
  });

  it('checks a radio on click', async () => {
    const user = userEvent.setup();
    render(<BasicRadioGroup />);
    await user.click(screen.getByRole('radio', { name: 'Two' }));
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onValueChange when the selection changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicRadioGroup onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: 'Two' }));
    expect(onValueChange).toHaveBeenCalledWith('two');
  });

  it('moves focus and selection (automatic activation) with ArrowDown/ArrowUp, skipping disabled radios', async () => {
    const user = userEvent.setup();
    render(<BasicRadioGroup />);
    screen.getByRole('radio', { name: 'One' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('aria-checked', 'true');

    // "Three" is disabled and excluded, so ArrowDown wraps back to "One"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveFocus();
  });

  it('uses roving tabIndex so only the checked radio is in the tab order', () => {
    render(<BasicRadioGroup />);
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('tabIndex', '-1');
  });

  it('makes the first radio the tab stop when nothing is checked yet', () => {
    render(
      <RadioGroup>
        <RadioGroup.Radio value="one">One</RadioGroup.Radio>
        <RadioGroup.Radio value="two">Two</RadioGroup.Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'false');
  });

  it('checks the focused radio with Space/Enter', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup>
        <RadioGroup.Radio value="one">One</RadioGroup.Radio>
        <RadioGroup.Radio value="two">Two</RadioGroup.Radio>
      </RadioGroup>,
    );
    screen.getByRole('radio', { name: 'One' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'true');
  });

  it('does not check a disabled radio on click', async () => {
    const user = userEvent.setup();
    render(<BasicRadioGroup />);
    await user.click(screen.getByRole('radio', { name: 'Three' }));
    expect(screen.getByRole('radio', { name: 'Three' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'true');
  });

  it('disables every radio when the group is disabled', () => {
    render(
      <RadioGroup disabled defaultValue="one">
        <RadioGroup.Radio value="one">One</RadioGroup.Radio>
        <RadioGroup.Radio value="two">Two</RadioGroup.Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('radio', { name: 'Two' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('throws when Radio is used outside <RadioGroup>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<RadioGroup.Radio value="one">One</RadioGroup.Radio>)).toThrow(
      '<RadioGroup.Item> must be used within <RadioGroup>',
    );
    consoleError.mockRestore();
  });
});
