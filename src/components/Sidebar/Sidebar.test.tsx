import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Sidebar } from './Sidebar';

function BasicSidebar() {
  return (
    <Sidebar>
      <Sidebar.Item href="/" active icon={<span data-testid="home-icon" />}>
        Dashboard
      </Sidebar.Item>
      <Sidebar.Group label="Settings">
        <Sidebar.Item href="/settings/profile" badge={<span data-testid="badge">3</span>}>
          Profile
        </Sidebar.Item>
        <Sidebar.Item href="/settings/billing">Billing</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar>
  );
}

describe('Sidebar (in-flow)', () => {
  it('renders a nav landmark labelled "Sidebar" by default', () => {
    render(<BasicSidebar />);
    expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(
      <Sidebar aria-label="Main navigation">
        <Sidebar.Item href="/">Dashboard</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current', () => {
    render(<BasicSidebar />);
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Profile/ })).not.toHaveAttribute('aria-current');
  });

  it('renders icon and badge content', () => {
    render(<BasicSidebar />);
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders actions as a sibling of the item link, not nested inside it', () => {
    render(
      <Sidebar>
        <Sidebar.Item href="/" actions={<button type="button">Rename</button>}>
          Dashboard
        </Sidebar.Item>
      </Sidebar>,
    );
    const link = screen.getByRole('link', { name: 'Dashboard' });
    const actionButton = screen.getByRole('button', { name: 'Rename' });
    expect(link).not.toContainElement(actionButton);
    expect(actionButton.parentElement?.parentElement).toBe(link.parentElement);
  });

  it('renders no actions element when actions is omitted', () => {
    const { container } = render(<BasicSidebar />);
    expect(container.querySelector('[data-sidebar-item-actions]')).not.toBeInTheDocument();
  });

  it('stops a pointerdown on actions from bubbling past the item', () => {
    const onPointerDown = vi.fn();
    render(
      <div onPointerDown={onPointerDown}>
        <Sidebar>
          <Sidebar.Item href="/" actions={<button type="button">Rename</button>}>
            Dashboard
          </Sidebar.Item>
        </Sidebar>
      </div>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Rename' }));
    expect(onPointerDown).not.toHaveBeenCalled();
  });

  it('renders a group label above its items', () => {
    render(<BasicSidebar />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Billing' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicSidebar />);
    await expectNoA11yViolations(container);
  });
});

describe('Sidebar (asDrawer)', () => {
  function ControlledDrawerSidebar() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open sidebar
        </button>
        <Sidebar asDrawer open={open} onOpenChange={setOpen}>
          <Sidebar.Item href="/">Dashboard</Sidebar.Item>
        </Sidebar>
      </>
    );
  }

  it('renders nothing until opened', () => {
    render(<ControlledDrawerSidebar />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a dialog labelled "Sidebar", without a duplicate nav landmark', async () => {
    const user = userEvent.setup();
    render(<ControlledDrawerSidebar />);
    await user.click(screen.getByRole('button', { name: 'Open sidebar' }));

    expect(screen.getByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sidebar asDrawer open onOpenChange={onOpenChange}>
        <Sidebar.Item href="/">Dashboard</Sidebar.Item>
      </Sidebar>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('has no accessibility violations when open', async () => {
    render(
      <Sidebar asDrawer open onOpenChange={() => {}}>
        <Sidebar.Item href="/">Dashboard</Sidebar.Item>
      </Sidebar>,
    );
    await expectNoA11yViolations(document.body);
  });
});
