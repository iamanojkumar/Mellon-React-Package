import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button/Button';

function BasicGroup(props: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <ButtonGroup orientation={props.orientation}>
      <Button>One</Button>
      <Button>Two</Button>
      <Button disabled>Three</Button>
      <Button>Four</Button>
    </ButtonGroup>
  );
}

describe('ButtonGroup', () => {
  it('renders role="toolbar" with all buttons', () => {
    render(<BasicGroup />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicGroup />);
    await expectNoA11yViolations(container);
  });

  it('only the first enabled button is a tab stop initially', () => {
    render(<BasicGroup />);
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('tabIndex', '-1');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveAttribute('tabIndex', '-1');
  });

  it('moves the roving tab stop with ArrowRight/ArrowLeft, skipping disabled buttons, and wraps', async () => {
    const user = userEvent.setup();
    render(<BasicGroup />);
    screen.getByRole('button', { name: 'One' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('tabIndex', '-1');

    // "Three" is disabled and excluded, so ArrowRight skips straight to "Four"
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();

    // wraps back to "One"
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();
  });

  it('uses ArrowUp/ArrowDown instead of ArrowRight/ArrowLeft when orientation is vertical', async () => {
    const user = userEvent.setup();
    render(<BasicGroup orientation="vertical" />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('sets aria-orientation and data-orientation, defaulting to horizontal', () => {
    render(<BasicGroup />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(toolbar).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('clicking a button moves the roving tab stop to it, not just arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(<BasicGroup />);
    await user.click(screen.getByRole('button', { name: 'Four' }));
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Four' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('tabIndex', '-1');

    // pressing an arrow key now continues from "Four", confirming the roving
    // stop actually moved rather than the click just focusing it in passing
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });
});
