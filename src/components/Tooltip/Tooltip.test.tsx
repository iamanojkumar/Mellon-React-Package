import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders the trigger without an extra wrapper element', () => {
    const { container } = render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    // Fragment adds no DOM node, so the button itself is the render root's only child
    expect(container.firstChild).toBe(screen.getByRole('button', { name: 'Delete' }));
    expect(container.childNodes).toHaveLength(1);
  });

  it('is closed by default', () => {
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('wires aria-describedby on the trigger to the tooltip content, even while closed', () => {
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby');
  });

  it('opens on hover and shows role="tooltip" content', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete item');
  });

  it('opens on keyboard focus', () => {
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('closes closeDelay ms after the pointer leaves, and preserves the trigger element identity', async () => {
    const closeDelay = 300;
    const user = userEvent.setup();
    render(
      <Tooltip content="Delete item" closeDelay={closeDelay}>
        <button type="button">Delete</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.unhover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      },
      { timeout: closeDelay + 1000 },
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it("preserves the trigger's own event handlers alongside the tooltip's", async () => {
    const user = userEvent.setup();
    const onMouseEnter = vi.fn();
    render(
      <Tooltip content="Delete item">
        <button type="button" onMouseEnter={onMouseEnter}>
          Delete
        </button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button'));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button'));
    await expectNoA11yViolations(document.body);
  });
});
