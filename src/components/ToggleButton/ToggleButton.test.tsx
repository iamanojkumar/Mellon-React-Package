import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  it('renders as a button by default', () => {
    render(<ToggleButton data-testid="toggle">Bold</ToggleButton>);
    expect(screen.getByTestId('toggle').tagName).toBe('BUTTON');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<ToggleButton as="a" href="#" data-testid="toggle" />);
    expect(screen.getByTestId('toggle').tagName).toBe('A');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ToggleButton ref={ref}>Bold</ToggleButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <ToggleButton data-testid="toggle" className="custom">
        Bold
      </ToggleButton>,
    );
    expect(screen.getByTestId('toggle').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ToggleButton>Bold</ToggleButton>);
    await expectNoA11yViolations(container);
  });

  it('defaults to aria-pressed=false and toggles on click when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects defaultPressed', () => {
    render(<ToggleButton defaultPressed>Bold</ToggleButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPressedChange with the new value', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<ToggleButton onPressedChange={onPressedChange}>Bold</ToggleButton>);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('is fully controlled when pressed is provided', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [pressed, setPressed] = useState(false);
      return (
        <ToggleButton pressed={pressed} onPressedChange={setPressed}>
          Bold
        </ToggleButton>
      );
    }
    render(<Controlled />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets data-pressed to match aria-pressed', async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(button).toHaveAttribute('data-pressed', 'true');
  });

  it('is disabled via the native attribute when rendered as a button', () => {
    render(<ToggleButton disabled>Bold</ToggleButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
