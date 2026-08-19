import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders as a native button by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(
      <Button as="a" href="#" data-testid="button">
        Link button
      </Button>,
    );
    expect(screen.getByTestId('button').tagName).toBe('A');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click me</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <Button className="custom" data-testid="button">
        Click me
      </Button>,
    );
    expect(screen.getByTestId('button').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    await expectNoA11yViolations(container);
  });

  it('defaults to variant=primary and size=md', () => {
    render(<Button data-testid="button">Click me</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('applies variant and size as data attributes', () => {
    render(
      <Button variant="danger" size="lg" data-testid="button">
        Delete
      </Button>,
    );
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('is disabled natively when disabled is set', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click me
      </Button>,
    );
    // pointer-events: none (applied to :disabled) makes the button
    // genuinely unclickable — userEvent throws rather than silently
    // no-op, which is stronger evidence than just checking the handler.
    await expect(user.click(screen.getByRole('button'))).rejects.toThrow();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses aria-disabled instead of the disabled attribute for non-button elements', () => {
    render(
      <Button as="a" href="#" disabled data-testid="button">
        Link button
      </Button>,
    );
    const button = screen.getByTestId('button');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets aria-busy and shows a spinner when loading, and forces disabled', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders icon before children by default', () => {
    render(<Button icon={<svg data-testid="icon" />}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    const icon = screen.getByTestId('icon');
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    // Icon wrapper should precede the text node in DOM order.
    expect(button.firstElementChild?.contains(icon)).toBe(true);
  });

  it('renders icon after children when iconPosition is end', () => {
    render(
      <Button icon={<svg data-testid="icon" />} iconPosition="end">
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    const icon = screen.getByTestId('icon');
    expect(button.lastElementChild?.contains(icon)).toBe(true);
  });

  it('hides the icon in favor of the spinner while loading', () => {
    render(
      <Button icon={<svg data-testid="icon" />} loading>
        Saving
      </Button>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  it('has no accessibility violations with an icon', async () => {
    const { container } = render(<Button icon={<svg data-testid="icon" />}>Save</Button>);
    await expectNoA11yViolations(container);
  });
});
