import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FocusTrap } from './FocusTrap';

describe('FocusTrap', () => {
  it('renders children', () => {
    render(
      <FocusTrap active={false}>
        <button type="button">content</button>
      </FocusTrap>,
    );
    expect(screen.getByRole('button', { name: 'content' })).toBeInTheDocument();
  });

  it('focuses the first focusable child when active', () => {
    render(
      <FocusTrap active>
        <button type="button">first</button>
        <button type="button">second</button>
      </FocusTrap>,
    );
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('cycles focus within its children on Tab', async () => {
    const user = userEvent.setup();
    render(
      <FocusTrap active>
        <button type="button">first</button>
        <button type="button">last</button>
      </FocusTrap>,
    );
    screen.getByRole('button', { name: 'last' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <FocusTrap active={false}>
        <button type="button">content</button>
      </FocusTrap>,
    );
    await expectNoA11yViolations(container);
  });
});
